import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { ApiError } from "@truenorth-it/dataverse-contact-api";
import type { Case, CaseNote, Tab, SortField, SortDir, GroupBy } from "../types/case";
import { useApiClient } from "../services/caseApi";
import { compareCases } from "../utils/style";

const CASE_FIELDS = [
  "incidentid", "ticketnumber", "title", "statuscode", "statecode",
  "prioritycode", "casetypecode", "createdon", "modifiedon",
];

const NOTES_FIELDS = [
  "annotationid", "subject", "notetext", "isdocument",
  "filename", "filesize", "createdon", "modifiedon",
];

export function useCases() {
  const { isAuthenticated } = useAuth0();
  const client = useApiClient();

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

  // Note form state
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteSubject, setNoteSubject] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [noteSubmitError, setNoteSubmitError] = useState<string | null>(null);

  // ── API wrappers ──────────────────────────────────────────────────

  const fetchCases = useCallback(
    async (scope: "me" | "team") => {
      const setLoading = scope === "me" ? setMyLoading : setTeamLoading;
      const setError = scope === "me" ? setMyError : setTeamError;
      const setCases = scope === "me" ? setMyCases : setTeamCases;

      setLoading(true);
      setError(null);

      try {
        const scopeClient = scope === "me" ? client.me : client.team;
        const result = await scopeClient.list<Case>("incident", {
          select: CASE_FIELDS,
          top: 200,
          orderBy: "modifiedon:desc",
        });
        setCases(result.data ?? []);
      } catch (err) {
        if (err instanceof ApiError && err.status === 403 && scope === "team") {
          setTeamAvailable(false);
          setCases([]);
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load cases");
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  const fetchCaseNotes = useCallback(
    async (incidentId: string, scope: "me" | "team") => {
      setNotesLoading(true);
      setNotesError(null);

      try {
        const scopeClient = scope === "me" ? client.me : client.team;
        const result = await scopeClient.list<CaseNote>("casenotes", {
          select: NOTES_FIELDS,
          filter: `objectid eq ${incidentId}`,
          orderBy: "createdon:desc",
          top: 100,
        });
        setCaseNotes(result.data ?? []);
      } catch (err) {
        setNotesError(err instanceof Error ? err.message : "Failed to load notes");
      } finally {
        setNotesLoading(false);
      }
    },
    [client],
  );

  const createCaseNote = useCallback(
    async (incidentId: string) => {
      setNoteSubmitting(true);
      setNoteSubmitError(null);

      try {
        await client.me.create("casenotes", {
          subject: noteSubject.trim() || null,
          notetext: noteBody.trim() || null,
          objectid_incident: incidentId,
        });
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
    [client, noteSubject, noteBody, activeTab, fetchCaseNotes],
  );

  // ── Case navigation ───────────────────────────────────────────────

  const openCase = useCallback(
    (c: Case) => {
      setSelectedCase(c);
      setCaseNotes([]);
      setShowNoteForm(false);
      setNoteSubject("");
      setNoteBody("");
      setNoteSubmitError(null);
      fetchCaseNotes(c.incidentid, activeTab);
    },
    [activeTab, fetchCaseNotes],
  );

  const closeCase = useCallback(() => {
    setSelectedCase(null);
    setCaseNotes([]);
    setNotesError(null);
    setShowNoteForm(false);
  }, []);

  // ── Initial load ──────────────────────────────────────────────────

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchCases("me");
    fetchCases("team");
  }, [isAuthenticated, fetchCases]);

  // ── Derived data ──────────────────────────────────────────────────

  const activeCases = activeTab === "me" ? myCases : teamCases;
  const activeLoading = activeTab === "me" ? myLoading : teamLoading;
  const activeError = activeTab === "me" ? myError : teamError;

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

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => compareCases(a, b, sortField, sortDir)),
    [filtered, sortField, sortDir],
  );

  const grouped = useMemo(() => {
    if (groupBy === "none") return null;
    const map = new Map<string, Case[]>();
    for (const c of sorted) {
      const labelKey = `${groupBy}_label` as keyof Case;
      const key = (c[labelKey] as string) ?? "Unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return map;
  }, [sorted, groupBy]);

  useEffect(() => {
    if (grouped) {
      setExpandedGroups(new Set(grouped.keys()));
    }
  }, [groupBy, activeTab]);

  const stats = useMemo(() => {
    const active = activeCases.filter((c) => c.statecode === 0).length;
    const resolved = activeCases.filter((c) => c.statecode === 1).length;
    const high = activeCases.filter((c) => c.prioritycode === 1).length;
    return { total: activeCases.length, active, resolved, high };
  }, [activeCases]);

  // ── Sort handler ──────────────────────────────────────────────────

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDir(field === "createdon" || field === "modifiedon" ? "desc" : "asc");
      }
    },
    [sortField],
  );

  const toggleGroup = useCallback((key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  return {
    // Auth-driven
    fetchCases,

    // Data
    myCases,
    teamCases,
    myLoading,
    teamLoading,
    activeCases,
    activeLoading,
    activeError,
    teamAvailable,

    // UI state
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    sortField,
    sortDir,
    handleSort,
    groupBy,
    setGroupBy,
    expandedGroups,
    toggleGroup,

    // Derived
    filtered,
    sorted,
    grouped,
    stats,

    // Case detail
    selectedCase,
    openCase,
    closeCase,
    caseNotes,
    notesLoading,
    notesError,
    fetchCaseNotes,

    // Note form
    showNoteForm,
    setShowNoteForm,
    noteSubject,
    setNoteSubject,
    noteBody,
    setNoteBody,
    noteSubmitting,
    noteSubmitError,
    setNoteSubmitError,
    createCaseNote,
  };
}
