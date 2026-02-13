import { useAuth0 } from "@auth0/auth0-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { config, API_BASE } from "./env";

// ── Types ────────────────────────────────────────────────────────────

interface Case {
  incidentid: string;
  ticketnumber: string;
  title: string;
  statuscode: number;
  statuscode_label?: string;
  statecode: number;
  statecode_label?: string;
  prioritycode: number;
  prioritycode_label?: string;
  casetypecode: number | null;
  casetypecode_label?: string;
  createdon: string;
  modifiedon: string;
  [key: string]: unknown;
}

interface CaseNote {
  annotationid: string;
  subject: string | null;
  notetext: string | null;
  isdocument: boolean;
  filename: string | null;
  filesize: number | null;
  createdon: string;
  modifiedon: string;
  [key: string]: unknown;
}

interface CaseResponse {
  data: Case[];
  page: { top: number; skip: number; next: string | null };
}

interface NotesResponse {
  data: CaseNote[];
  page: { top: number; skip: number; next: string | null };
}

type SortField = "ticketnumber" | "title" | "statuscode" | "prioritycode" | "createdon" | "modifiedon";
type SortDir = "asc" | "desc";
type GroupBy = "none" | "statuscode" | "prioritycode" | "casetypecode";
type Tab = "me" | "team";

// ── Helpers ──────────────────────────────────────────────────────────

const FIELDS = [
  "incidentid", "ticketnumber", "title", "statuscode", "statecode",
  "prioritycode", "casetypecode", "createdon", "modifiedon",
].join(",");

const NOTES_FIELDS = [
  "annotationid", "subject", "notetext", "isdocument",
  "filename", "filesize", "createdon", "modifiedon",
].join(",");

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateFull(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function statusColor(code: number): { bg: string; text: string; dot: string } {
  switch (code) {
    case 0: return { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" };
    case 1: return { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" };
    case 2: return { bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400" };
    default: return { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400" };
  }
}

function priorityBadge(code: number): { label: string; color: string } {
  switch (code) {
    case 1: return { label: "High", color: "text-red-600 bg-red-50 border-red-200" };
    case 2: return { label: "Normal", color: "text-amber-600 bg-amber-50 border-amber-200" };
    case 3: return { label: "Low", color: "text-green-600 bg-green-50 border-green-200" };
    default: return { label: "—", color: "text-gray-500 bg-gray-50 border-gray-200" };
  }
}

/** Strip script tags, event handlers, and dangerous attributes from HTML */
function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  // Remove script/style/iframe elements
  for (const tag of Array.from(doc.querySelectorAll("script, style, iframe, object, embed"))) {
    tag.remove();
  }
  // Remove event handler attributes (onclick, onerror, etc.)
  for (const el of Array.from(doc.querySelectorAll("*"))) {
    for (const attr of Array.from(el.attributes)) {
      if (attr.name.startsWith("on") || attr.value.trimStart().startsWith("javascript:")) {
        el.removeAttribute(attr.name);
      }
    }
  }
  return doc.body.innerHTML;
}

// ── Sort comparator ──────────────────────────────────────────────────

function compareCases(a: Case, b: Case, field: SortField, dir: SortDir): number {
  let av: string | number = "";
  let bv: string | number = "";

  switch (field) {
    case "ticketnumber":
    case "title":
      av = (a[field] ?? "").toString().toLowerCase();
      bv = (b[field] ?? "").toString().toLowerCase();
      break;
    case "statuscode":
    case "prioritycode":
      av = a[field] ?? 0;
      bv = b[field] ?? 0;
      break;
    case "createdon":
    case "modifiedon":
      av = a[field] ?? "";
      bv = b[field] ?? "";
      break;
  }

  const cmp = av < bv ? -1 : av > bv ? 1 : 0;
  return dir === "asc" ? cmp : -cmp;
}

// ── Main Component ───────────────────────────────────────────────────

export function App() {
  const {
    isAuthenticated,
    isLoading: authLoading,
    user,
    loginWithRedirect,
    logout,
    getAccessTokenSilently,
  } = useAuth0();

  // Data state
  const [myCases, setMyCases] = useState<Case[]>([]);
  const [teamCases, setTeamCases] = useState<Case[]>([]);
  const [myLoading, setMyLoading] = useState(false);
  const [teamLoading, setTeamLoading] = useState(false);
  const [myError, setMyError] = useState<string | null>(null);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [teamAvailable, setTeamAvailable] = useState(true);

  // UI state
  const [activeTab, setActiveTab] = useState<Tab>("me");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("modifiedon");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Case detail state
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [caseNotes, setCaseNotes] = useState<CaseNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  // Add note form state
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteSubject, setNoteSubject] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [noteSubmitError, setNoteSubmitError] = useState<string | null>(null);

  // ── API calls ────────────────────────────────────────────────────

  const fetchCases = useCallback(
    async (scope: "me" | "team") => {
      const setLoading = scope === "me" ? setMyLoading : setTeamLoading;
      const setError = scope === "me" ? setMyError : setTeamError;
      const setCases = scope === "me" ? setMyCases : setTeamCases;

      setLoading(true);
      setError(null);

      try {
        const token = await getAccessTokenSilently();
        const base = config.apiBaseUrl.replace(/\/+$/, "");
        const url = `${base}${API_BASE}/${scope}/incident?select=${FIELDS}&top=200&orderBy=modifiedon:desc`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          if (res.status === 403 && scope === "team") {
            setTeamAvailable(false);
            setCases([]);
            return;
          }
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { message?: string }).message ?? `HTTP ${res.status}`);
        }

        const data: CaseResponse = await res.json();
        setCases(data.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load cases");
      } finally {
        setLoading(false);
      }
    },
    [getAccessTokenSilently],
  );

  const fetchCaseNotes = useCallback(
    async (incidentId: string, scope: "me" | "team") => {
      setNotesLoading(true);
      setNotesError(null);

      try {
        const token = await getAccessTokenSilently();
        const base = config.apiBaseUrl.replace(/\/+$/, "");
        const filterParam = encodeURIComponent(`objectid eq ${incidentId}`);
        const url = `${base}${API_BASE}/${scope}/casenotes?select=${NOTES_FIELDS}&filter=${filterParam}&orderBy=createdon:desc&top=100`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { message?: string }).message ?? `HTTP ${res.status}`);
        }

        const data: NotesResponse = await res.json();
        setCaseNotes(data.data ?? []);
      } catch (err) {
        setNotesError(err instanceof Error ? err.message : "Failed to load notes");
      } finally {
        setNotesLoading(false);
      }
    },
    [getAccessTokenSilently],
  );

  const createCaseNote = useCallback(
    async (incidentId: string) => {
      setNoteSubmitting(true);
      setNoteSubmitError(null);

      try {
        const token = await getAccessTokenSilently();
        const base = config.apiBaseUrl.replace(/\/+$/, "");
        const url = `${base}${API_BASE}/me/casenotes`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subject: noteSubject.trim() || null,
            notetext: noteBody.trim() || null,
            objectid_incident: incidentId,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { message?: string }).message ?? `HTTP ${res.status}`);
        }

        // Success — reset form and refresh notes
        setNoteSubject("");
        setNoteBody("");
        setShowNoteForm(false);
        fetchCaseNotes(incidentId, activeTab);
      } catch (err) {
        setNoteSubmitError(err instanceof Error ? err.message : "Failed to create note");
      } finally {
        setNoteSubmitting(false);
      }
    },
    [getAccessTokenSilently, noteSubject, noteBody, activeTab, fetchCaseNotes],
  );

  function openCase(c: Case) {
    setSelectedCase(c);
    setCaseNotes([]);
    setShowNoteForm(false);
    setNoteSubject("");
    setNoteBody("");
    setNoteSubmitError(null);
    fetchCaseNotes(c.incidentid, activeTab);
  }

  function closeCase() {
    setSelectedCase(null);
    setCaseNotes([]);
    setNotesError(null);
    setShowNoteForm(false);
  }

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchCases("me");
    fetchCases("team");
  }, [isAuthenticated, fetchCases]);

  // ── Derived data ─────────────────────────────────────────────────

  const activeCases = activeTab === "me" ? myCases : teamCases;
  const activeLoading = activeTab === "me" ? myLoading : teamLoading;
  const activeError = activeTab === "me" ? myError : teamError;

  // Filter
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return activeCases;
    const q = searchQuery.toLowerCase();
    return activeCases.filter(
      (c) =>
        c.ticketnumber?.toLowerCase().includes(q) ||
        c.title?.toLowerCase().includes(q) ||
        c.statuscode_label?.toLowerCase().includes(q) ||
        c.prioritycode_label?.toLowerCase().includes(q) ||
        c.casetypecode_label?.toLowerCase().includes(q),
    );
  }, [activeCases, searchQuery]);

  // Sort
  const sorted = useMemo(
    () => [...filtered].sort((a, b) => compareCases(a, b, sortField, sortDir)),
    [filtered, sortField, sortDir],
  );

  // Group
  const grouped = useMemo(() => {
    if (groupBy === "none") return null;
    const map = new Map<string, Case[]>();
    for (const c of sorted) {
      const labelKey = `${groupBy}_label` as keyof Case;
      const key = (c[labelKey] as string) ?? `Unknown`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return map;
  }, [sorted, groupBy]);

  // Auto-expand all groups when grouping changes
  useEffect(() => {
    if (grouped) {
      setExpandedGroups(new Set(grouped.keys()));
    }
  }, [groupBy, activeTab]);

  // ── Sort handler ─────────────────────────────────────────────────

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "createdon" || field === "modifiedon" ? "desc" : "asc");
    }
  }

  function toggleGroup(key: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // ── Stats ────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const active = activeCases.filter((c) => c.statecode === 0).length;
    const resolved = activeCases.filter((c) => c.statecode === 1).length;
    const high = activeCases.filter((c) => c.prioritycode === 1).length;
    return { total: activeCases.length, active, resolved, high };
  }, [activeCases]);

  // ── Column header component ──────────────────────────────────────

  function SortHeader({ field, label, className }: { field: SortField; label: string; className?: string }) {
    const isActive = sortField === field;
    return (
      <th
        className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer
          select-none transition-colors hover:bg-tn-navy/5 ${className ?? ""}`}
        onClick={() => handleSort(field)}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          {isActive && (
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
              {sortDir === "asc"
                ? <path d="M6 2l4 5H2z" />
                : <path d="M6 10L2 5h8z" />}
            </svg>
          )}
        </span>
      </th>
    );
  }

  // ── Case row component ───────────────────────────────────────────

  function CaseRow({ c }: { c: Case }) {
    const sc = statusColor(c.statecode);
    const pb = priorityBadge(c.prioritycode);

    return (
      <tr
        className="border-b border-tn-border/50 hover:bg-tn-sky/5 transition-colors cursor-pointer"
        onClick={() => openCase(c)}
      >
        <td className="px-4 py-3 whitespace-nowrap">
          <span className="font-mono text-xs font-medium text-tn-slate">{c.ticketnumber}</span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-tn-navy">{c.title}</span>
            <svg className="w-3.5 h-3.5 text-tn-muted/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
            {c.statuscode_label ?? `Status ${c.statuscode}`}
          </span>
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${pb.color}`}>
            {c.prioritycode_label ?? pb.label}
          </span>
        </td>
        <td className="px-4 py-3">
          <span className="text-xs text-tn-muted">{c.casetypecode_label ?? "—"}</span>
        </td>
        <td className="px-4 py-3">
          <span className="text-xs text-tn-muted" title={new Date(c.createdon).toLocaleString()}>
            {formatDate(c.createdon)}
          </span>
        </td>
        <td className="px-4 py-3">
          <span className="text-xs text-tn-muted" title={new Date(c.modifiedon).toLocaleString()}>
            {formatDate(c.modifiedon)}
          </span>
        </td>
      </tr>
    );
  }

  // ── Render: Loading/Unauth states ────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen bg-tn-bg flex items-center justify-center">
        <div className="animate-pulse text-tn-muted text-sm">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-tn-navy via-tn-navy-light to-tn-dark flex items-center justify-center font-sans">
        <div className="text-center max-w-lg px-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-tn-sky/15 mb-6">
            <svg viewBox="0 0 24 24" className="w-10 h-10 text-tn-sky" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Case Portal</h1>
          <p className="text-tn-sky/70 text-base leading-relaxed mb-8">
            View and track your support cases. Sign in to get started.
          </p>
          <button
            className="px-8 py-3 rounded-lg bg-tn-sky text-tn-navy font-semibold text-sm
              hover:bg-tn-sky-light transition-all cursor-pointer shadow-lg shadow-tn-sky/20
              hover:shadow-tn-sky/30 hover:-translate-y-0.5"
            onClick={() => loginWithRedirect()}
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Authenticated ────────────────────────────────────────

  const firstName = user?.given_name ?? user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="min-h-screen bg-tn-bg font-sans text-tn-navy">
      {/* Header */}
      <header className="bg-tn-navy text-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-tn-sky" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="font-bold text-base">Case Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-tn-sky/80">{user?.email}</span>
            {user?.picture && (
              <img src={user.picture} alt="" className="w-7 h-7 rounded-full border border-tn-sky/30" />
            )}
            <button
              className="px-3 py-1.5 text-xs rounded-md border border-white/30
                bg-transparent text-white hover:bg-white/10 transition-colors cursor-pointer"
              onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Welcome hero */}
      <div className="bg-gradient-to-r from-tn-navy via-tn-navy-light to-tn-navy">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-bold text-white mb-1">
            Welcome back, {firstName}
          </h1>
          <p className="text-tn-sky/70 text-sm">
            Here's an overview of your support cases
          </p>

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {[
              { label: "Total Cases", value: stats.total, icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
              { label: "Active", value: stats.active, icon: "M13 10V3L4 14h7v7l9-11h-7z" },
              { label: "Resolved", value: stats.resolved, icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
              { label: "High Priority", value: stats.high, icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10"
              >
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-tn-sky/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                  </svg>
                  <span className="text-[11px] text-tn-sky/60 uppercase tracking-wider font-medium">{s.label}</span>
                </div>
                <span className="text-2xl font-bold text-white">
                  {activeLoading ? "—" : s.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Toolbar (hidden during case detail view) */}
        <div className={`bg-white rounded-xl border border-tn-border shadow-sm mb-4 ${selectedCase ? "hidden" : ""}`}>
          <div className="p-4 flex flex-wrap items-center gap-3">
            {/* Tabs: Me / Team */}
            <div className="inline-flex rounded-lg border border-tn-border overflow-hidden">
              <button
                className={`px-4 py-2 text-xs font-semibold transition-colors cursor-pointer border-none
                  ${activeTab === "me" ? "bg-tn-navy text-white" : "bg-white text-tn-slate hover:bg-tn-bg"}`}
                onClick={() => { setActiveTab("me"); closeCase(); }}
              >
                My Cases
                {!myLoading && <span className="ml-1.5 opacity-60">({myCases.length})</span>}
              </button>
              {teamAvailable && (
                <button
                  className={`px-4 py-2 text-xs font-semibold transition-colors cursor-pointer border-none border-l border-tn-border
                    ${activeTab === "team" ? "bg-tn-navy text-white" : "bg-white text-tn-slate hover:bg-tn-bg"}`}
                  onClick={() => { setActiveTab("team"); closeCase(); }}
                >
                  Team Cases
                  {!teamLoading && <span className="ml-1.5 opacity-60">({teamCases.length})</span>}
                </button>
              )}
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tn-muted"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search cases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-tn-border bg-tn-bg/50
                  focus:outline-none focus:ring-2 focus:ring-tn-sky/50 focus:border-tn-sky
                  placeholder:text-tn-muted/60"
              />
              {searchQuery && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-tn-muted hover:text-tn-navy
                    cursor-pointer bg-transparent border-none p-0"
                  onClick={() => setSearchQuery("")}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Group by */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-tn-muted font-medium">Group by:</span>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                className="text-xs px-3 py-2 rounded-lg border border-tn-border bg-white
                  focus:outline-none focus:ring-2 focus:ring-tn-sky/50 cursor-pointer"
              >
                <option value="none">None</option>
                <option value="statuscode">Status</option>
                <option value="prioritycode">Priority</option>
                <option value="casetypecode">Case Type</option>
              </select>
            </div>

            {/* Refresh */}
            <button
              className="px-3 py-2 text-xs rounded-lg border border-tn-border bg-white
                text-tn-slate hover:bg-tn-bg transition-colors cursor-pointer
                disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={activeLoading}
              onClick={() => fetchCases(activeTab)}
            >
              {activeLoading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {/* Filter summary */}
          {searchQuery && (
            <div className="px-4 pb-3 text-xs text-tn-muted">
              Showing {filtered.length} of {activeCases.length} cases matching "{searchQuery}"
            </div>
          )}
        </div>

        {/* ── Case detail view ──────────────────────────────────── */}
        {selectedCase && (
          <div className="space-y-4">
            {/* Breadcrumb */}
            <button
              onClick={closeCase}
              className="inline-flex items-center gap-1.5 text-sm text-tn-slate hover:text-tn-navy
                transition-colors cursor-pointer bg-transparent border-none p-0 group"
            >
              <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m0 0l7 7m-7-7l7-7" />
              </svg>
              Back to {activeTab === "me" ? "My" : "Team"} Cases
            </button>

            {/* Case header card */}
            <div className="bg-white rounded-xl border border-tn-border shadow-sm overflow-hidden">
              {/* Coloured top stripe */}
              <div className={`h-1 ${statusColor(selectedCase.statecode).dot}`} />

              <div className="p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-xs font-semibold text-tn-muted bg-tn-bg px-2 py-0.5 rounded">
                        {selectedCase.ticketnumber}
                      </span>
                      {(() => {
                        const sc = statusColor(selectedCase.statecode);
                        return (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {selectedCase.statuscode_label ?? `Status ${selectedCase.statuscode}`}
                          </span>
                        );
                      })()}
                    </div>
                    <h2 className="text-xl font-bold text-tn-navy mt-2 mb-0 leading-snug">
                      {selectedCase.title}
                    </h2>
                  </div>
                  {(() => {
                    const pb = priorityBadge(selectedCase.prioritycode);
                    return (
                      <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-semibold border ${pb.color} shrink-0`}>
                        {selectedCase.prioritycode_label ?? pb.label} Priority
                      </span>
                    );
                  })()}
                </div>

                {/* Metadata grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-tn-border/50">
                  {[
                    { label: "Case Type", value: selectedCase.casetypecode_label ?? "—" },
                    { label: "Status", value: selectedCase.statecode_label ?? (selectedCase.statecode === 0 ? "Active" : selectedCase.statecode === 1 ? "Resolved" : "Cancelled") },
                    { label: "Created", value: formatDateFull(selectedCase.createdon) },
                    { label: "Last Modified", value: formatDateFull(selectedCase.modifiedon) },
                  ].map((item) => (
                    <div key={item.label}>
                      <dt className="text-[11px] text-tn-muted uppercase tracking-wider font-medium mb-0.5">{item.label}</dt>
                      <dd className="text-sm text-tn-navy font-medium m-0">{item.value}</dd>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Case notes section */}
            <div className="bg-white rounded-xl border border-tn-border shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-tn-border/50">
                <div className="flex items-center gap-2.5">
                  <svg className="w-5 h-5 text-tn-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                  <h3 className="text-sm font-bold text-tn-navy m-0">Case Notes</h3>
                  {!notesLoading && (
                    <span className="text-xs text-tn-muted bg-tn-bg px-2 py-0.5 rounded-full font-medium">
                      {caseNotes.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setShowNoteForm((v) => !v); setNoteSubmitError(null); }}
                    className="px-3 py-1.5 text-xs rounded-lg border border-tn-sky bg-tn-sky/10
                      text-tn-navy font-medium hover:bg-tn-sky/20 transition-colors cursor-pointer"
                  >
                    {showNoteForm ? "Cancel" : "+ Add Note"}
                  </button>
                  <button
                    onClick={() => fetchCaseNotes(selectedCase.incidentid, activeTab)}
                    disabled={notesLoading}
                    className="px-3 py-1.5 text-xs rounded-lg border border-tn-border bg-white
                      text-tn-slate hover:bg-tn-bg transition-colors cursor-pointer
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {notesLoading ? "Loading..." : "Refresh"}
                  </button>
                </div>
              </div>

              {/* Add note form */}
              {showNoteForm && (
                <div className="px-6 pb-4 border-b border-tn-border/50">
                  <div className="bg-tn-bg/50 border border-tn-border/60 rounded-lg p-4 space-y-3">
                    <input
                      type="text"
                      placeholder="Subject (optional)"
                      value={noteSubject}
                      onChange={(e) => setNoteSubject(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-tn-border bg-white
                        focus:outline-none focus:ring-2 focus:ring-tn-sky/50 focus:border-tn-sky
                        placeholder:text-tn-muted/60"
                    />
                    <textarea
                      placeholder="Write your note..."
                      value={noteBody}
                      onChange={(e) => setNoteBody(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-tn-border bg-white
                        focus:outline-none focus:ring-2 focus:ring-tn-sky/50 focus:border-tn-sky
                        placeholder:text-tn-muted/60 resize-y"
                    />
                    {noteSubmitError && (
                      <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                        {noteSubmitError}
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => { setShowNoteForm(false); setNoteSubject(""); setNoteBody(""); setNoteSubmitError(null); }}
                        className="px-4 py-2 text-xs rounded-lg border border-tn-border bg-white
                          text-tn-slate hover:bg-tn-bg transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => createCaseNote(selectedCase.incidentid)}
                        disabled={noteSubmitting || (!noteSubject.trim() && !noteBody.trim())}
                        className="px-4 py-2 text-xs rounded-lg border border-tn-navy bg-tn-navy
                          text-white font-medium hover:bg-tn-navy-light transition-colors cursor-pointer
                          disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {noteSubmitting ? "Saving..." : "Save Note"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-6">
                {/* Notes loading */}
                {notesLoading && caseNotes.length === 0 && (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-2 h-2 bg-tn-border/50 rounded-full" />
                          <div className="h-3 bg-tn-border/50 rounded w-32" />
                          <div className="h-3 bg-tn-border/50 rounded w-24 ml-auto" />
                        </div>
                        <div className="ml-5 h-4 bg-tn-border/50 rounded w-3/4" />
                        <div className="ml-5 h-4 bg-tn-border/50 rounded w-1/2 mt-1.5" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Notes error */}
                {notesError && (
                  <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-red-800 m-0">Failed to load notes</p>
                      <p className="text-xs text-red-600 mt-0.5 m-0">{notesError}</p>
                    </div>
                  </div>
                )}

                {/* Notes empty */}
                {!notesLoading && !notesError && caseNotes.length === 0 && (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-tn-border mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <p className="text-sm text-tn-muted m-0">No notes on this case yet.</p>
                  </div>
                )}

                {/* Notes timeline */}
                {caseNotes.length > 0 && (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-[5px] top-2 bottom-2 w-px bg-tn-border/60" />

                    <div className="space-y-5">
                      {caseNotes.map((note, idx) => (
                        <div key={note.annotationid ?? idx} className="relative pl-7">
                          {/* Timeline dot */}
                          <div className={`absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full border-2 border-white shadow-sm
                            ${idx === 0 ? "bg-tn-sky" : "bg-tn-border"}`}
                          />

                          <div className="bg-tn-bg/50 border border-tn-border/60 rounded-lg px-4 py-3 hover:border-tn-border transition-colors">
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="text-sm font-semibold text-tn-navy m-0 leading-snug">
                                {note.subject || <span className="text-tn-muted italic font-normal">No subject</span>}
                              </h4>
                              <time className="text-[11px] text-tn-muted whitespace-nowrap shrink-0 mt-0.5" title={new Date(note.createdon).toLocaleString()}>
                                {formatDate(note.createdon)}
                              </time>
                            </div>

                            {note.notetext && (
                              <div
                                className="mt-2 text-sm text-tn-slate leading-relaxed
                                  [&_p]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
                                  [&_a]:text-tn-teal [&_a]:underline [&_h1]:text-base [&_h1]:font-bold [&_h1]:my-2
                                  [&_h2]:text-sm [&_h2]:font-bold [&_h2]:my-1.5 [&_h3]:text-sm [&_h3]:font-semibold
                                  [&_table]:border-collapse [&_td]:border [&_td]:border-tn-border [&_td]:px-2 [&_td]:py-1
                                  [&_th]:border [&_th]:border-tn-border [&_th]:px-2 [&_th]:py-1 [&_th]:bg-tn-bg/50"
                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(note.notetext) }}
                              />
                            )}

                            {/* Attachment badge */}
                            {note.isdocument && note.filename && (
                              <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-tn-border/60 rounded-md">
                                <svg className="w-3.5 h-3.5 text-tn-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                                </svg>
                                <span className="text-xs text-tn-slate font-medium">{note.filename}</span>
                                {note.filesize != null && (
                                  <span className="text-[10px] text-tn-muted">
                                    ({(note.filesize / 1024).toFixed(1)} KB)
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Case list view ─────────────────────────────────────── */}

        {/* Error state */}
        {!selectedCase && activeError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800">Failed to load cases</p>
              <p className="text-xs text-red-600 mt-0.5">{activeError}</p>
              <button
                className="mt-2 text-xs text-red-700 underline cursor-pointer bg-transparent border-none p-0"
                onClick={() => fetchCases(activeTab)}
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {!selectedCase && activeLoading && !activeError && (
          <div className="bg-white rounded-xl border border-tn-border shadow-sm overflow-hidden">
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse flex gap-4">
                  <div className="h-4 bg-tn-border/50 rounded w-20" />
                  <div className="h-4 bg-tn-border/50 rounded flex-1" />
                  <div className="h-4 bg-tn-border/50 rounded w-24" />
                  <div className="h-4 bg-tn-border/50 rounded w-16" />
                  <div className="h-4 bg-tn-border/50 rounded w-16" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!selectedCase && !activeLoading && !activeError && activeCases.length === 0 && (
          <div className="bg-white rounded-xl border border-tn-border shadow-sm p-12 text-center">
            <svg className="w-16 h-16 text-tn-border mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-lg font-semibold text-tn-navy mb-1">No cases found</h3>
            <p className="text-sm text-tn-muted">
              {activeTab === "me"
                ? "You don't have any cases assigned to you yet."
                : "No team cases are available."}
            </p>
          </div>
        )}

        {/* Data table — ungrouped */}
        {!selectedCase && !activeLoading && !activeError && sorted.length > 0 && groupBy === "none" && (
          <div className="bg-white rounded-xl border border-tn-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-tn-border bg-tn-bg/50 text-tn-slate">
                    <SortHeader field="ticketnumber" label="Case #" className="w-44" />
                    <SortHeader field="title" label="Title" />
                    <SortHeader field="statuscode" label="Status" className="w-36" />
                    <SortHeader field="prioritycode" label="Priority" className="w-28" />
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-28">Type</th>
                    <SortHeader field="createdon" label="Created" className="w-28" />
                    <SortHeader field="modifiedon" label="Modified" className="w-28" />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((c) => (
                    <CaseRow key={c.incidentid} c={c} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Data table — grouped */}
        {!selectedCase && !activeLoading && !activeError && grouped && grouped.size > 0 && (
          <div className="space-y-3">
            {Array.from(grouped.entries()).map(([groupLabel, cases]) => {
              const isExpanded = expandedGroups.has(groupLabel);
              return (
                <div key={groupLabel} className="bg-white rounded-xl border border-tn-border shadow-sm overflow-hidden">
                  {/* Group header */}
                  <button
                    className="w-full px-5 py-3 flex items-center justify-between bg-tn-bg/50
                      hover:bg-tn-bg transition-colors cursor-pointer border-none text-left"
                    onClick={() => toggleGroup(groupLabel)}
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className={`w-4 h-4 text-tn-slate transition-transform ${isExpanded ? "rotate-90" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="text-sm font-semibold text-tn-navy">{groupLabel}</span>
                      <span className="text-xs text-tn-muted bg-tn-border/40 px-2 py-0.5 rounded-full">
                        {cases.length}
                      </span>
                    </div>
                  </button>

                  {/* Group table */}
                  {isExpanded && (
                    <div className="overflow-x-auto border-t border-tn-border/50">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-tn-border/50 bg-tn-bg/30 text-tn-slate">
                            <SortHeader field="ticketnumber" label="Case #" className="w-44" />
                            <SortHeader field="title" label="Title" />
                            <SortHeader field="statuscode" label="Status" className="w-36" />
                            <SortHeader field="prioritycode" label="Priority" className="w-28" />
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-28">Type</th>
                            <SortHeader field="createdon" label="Created" className="w-28" />
                            <SortHeader field="modifiedon" label="Modified" className="w-28" />
                          </tr>
                        </thead>
                        <tbody>
                          {cases.map((c) => (
                            <CaseRow key={c.incidentid} c={c} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* No results from search */}
        {!selectedCase && !activeLoading && !activeError && activeCases.length > 0 && filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-tn-border shadow-sm p-8 text-center">
            <p className="text-sm text-tn-muted">No cases match your search.</p>
            <button
              className="mt-2 text-xs text-tn-teal underline cursor-pointer bg-transparent border-none p-0"
              onClick={() => setSearchQuery("")}
            >
              Clear search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
