import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@truenorth-it/dataverse-client";
import type { Case, CaseNote, CaseActivity, ActivityTypeFilter, Tab, SortField, SortDir, GroupBy } from "../types/case";
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

const ACTIVITY_FIELDS = [
  "activityid", "subject", "description", "activitytypecode",
  "prioritycode", "statecode", "statuscode",
  "scheduledstart", "scheduledend", "actualstart", "actualend",
  "createdon", "modifiedon",
];

const ACTIVITY_TYPE_ROUTES: Record<Exclude<ActivityTypeFilter, "all">, string> = {
  email: "caseemails",
  phonecall: "casephonecalls",
  task: "casetasks",
  appointment: "caseappointments",
};

type AggRow = { statecode: number; prioritycode: number; count: number };
type AggStats = { total: number; active: number; resolved: number; high: number };

function computeAggStats(rows: AggRow[]): AggStats {
  let total = 0, active = 0, resolved = 0, high = 0;
  for (const r of rows) {
    total += r.count;
    if (r.statecode === 0) active += r.count;
    if (r.statecode === 1) resolved += r.count;
    if (r.prioritycode === 1) high += r.count;
  }
  return { total, active, resolved, high };
}

export function useCases() {
  const { isAuthenticated } = useAuth0();
  const client = useApiClient();
  const queryClient = useQueryClient();

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
  const [selectedCaseScope, setSelectedCaseScope] = useState<Tab>("me");

  // Activity state
  const [activityTypeFilter, setActivityTypeFilter] = useState<ActivityTypeFilter>("all");
  const [selectedActivity, setSelectedActivity] = useState<CaseActivity | null>(null);

  // Note form state
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteSubject, setNoteSubject] = useState("");
  const [noteBody, setNoteBody] = useState("");

  // Create case form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");

  // ── TanStack Query: Cases ────────────────────────────────────────

  const myCasesQuery = useQuery({
    queryKey: ["cases", "me"] as const,
    queryFn: async () => {
      const result = await client.me.list<Case>("case", {
        select: CASE_FIELDS,
        top: 200,
        orderBy: "modifiedon:desc",
      });
      return result.data ?? [];
    },
    enabled: isAuthenticated,
  });

  const teamCasesQuery = useQuery({
    queryKey: ["cases", "team"] as const,
    queryFn: async () => {
      try {
        const result = await client.team.list<Case>("case", {
          select: CASE_FIELDS,
          top: 200,
          orderBy: "modifiedon:desc",
        });
        return result.data ?? [];
      } catch (err) {
        if (err instanceof ApiError && err.status === 403) {
          setTeamAvailable(false);
          return [];
        }
        throw err;
      }
    },
    enabled: isAuthenticated,
  });

  // ── TanStack Query: Aggregate Stats ──────────────────────────────

  const myAggQuery = useQuery({
    queryKey: ["aggStats", "me"] as const,
    queryFn: async () => {
      try {
        const result = await client.me.aggregate<AggRow>("case", {
          aggregate: "count",
          groupBy: ["statecode", "prioritycode"],
        });
        return computeAggStats(result.data ?? []);
      } catch {
        return null;
      }
    },
    enabled: isAuthenticated,
  });

  const teamAggQuery = useQuery({
    queryKey: ["aggStats", "team"] as const,
    queryFn: async () => {
      try {
        const result = await client.team.aggregate<AggRow>("case", {
          aggregate: "count",
          groupBy: ["statecode", "prioritycode"],
        });
        return computeAggStats(result.data ?? []);
      } catch {
        return null;
      }
    },
    enabled: isAuthenticated,
  });

  // ── TanStack Query: Case Notes ───────────────────────────────────

  const notesQuery = useQuery({
    queryKey: ["caseNotes", selectedCase?.incidentid, selectedCaseScope] as const,
    queryFn: async () => {
      const scopeClient = selectedCaseScope === "me" ? client.me : client.team;
      const result = await scopeClient.list<CaseNote>("casenotes", {
        select: NOTES_FIELDS,
        filter: `incidentid eq ${selectedCase!.incidentid}`,
        orderBy: "createdon:desc",
        top: 100,
      });
      return result.data ?? [];
    },
    enabled: isAuthenticated && !!selectedCase,
  });

  // ── TanStack Query: Case Activities ─────────────────────────────

  const activitiesQuery = useQuery({
    queryKey: ["caseActivities", selectedCase?.incidentid, selectedCaseScope, activityTypeFilter] as const,
    queryFn: async () => {
      const scopeClient = selectedCaseScope === "me" ? client.me : client.team;
      const route = activityTypeFilter === "all"
        ? "caseactivities"
        : ACTIVITY_TYPE_ROUTES[activityTypeFilter];
      const result = await scopeClient.list<CaseActivity>(route, {
        select: ACTIVITY_FIELDS,
        filter: `incidentid eq ${selectedCase!.incidentid}`,
        orderBy: "createdon:desc",
        top: 100,
      });
      return result.data ?? [];
    },
    enabled: isAuthenticated && !!selectedCase,
  });

  // ── TanStack Query: Mutations ────────────────────────────────────

  const createNoteMutation = useMutation({
    mutationFn: async (data: { incidentId: string; subject: string; body: string }) => {
      await client.me.create("casenotes", {
        subject: data.subject || null,
        notetext: data.body || null,
        incidentid: data.incidentId,
      });
      return data.incidentId;
    },
    onSuccess: (incidentId) => {
      setNoteSubject("");
      setNoteBody("");
      setShowNoteForm(false);
      queryClient.invalidateQueries({ queryKey: ["caseNotes", incidentId] });
    },
  });

  const createCaseMutation = useMutation({
    mutationFn: async (data: { title: string; description: string }) => {
      return client.me.create<Case>("case", {
        title: data.title,
        description: data.description || null,
      });
    },
    onSuccess: (result) => {
      setCreateTitle("");
      setCreateDescription("");
      setShowCreateForm(false);
      if (result.data) {
        queryClient.setQueryData<Case[]>(["cases", "me"], (old) =>
          old ? [result.data!, ...old] : [result.data!],
        );
        setSelectedCase(result.data);
        setSelectedCaseScope("me");
        setShowNoteForm(false);
        setNoteSubject("");
        setNoteBody("");
      }
      queryClient.invalidateQueries({ queryKey: ["cases", "me"] });
      queryClient.invalidateQueries({ queryKey: ["aggStats", "me"] });
    },
  });

  // ── Derived data from queries ────────────────────────────────────

  const myCases = myCasesQuery.data ?? [];
  const teamCases = teamCasesQuery.data ?? [];
  const myLoading = myCasesQuery.isLoading;
  const teamLoading = teamCasesQuery.isLoading;
  const myError = myCasesQuery.error
    ? (myCasesQuery.error instanceof Error ? myCasesQuery.error.message : "Failed to load cases")
    : null;
  const teamError = teamCasesQuery.error
    ? (teamCasesQuery.error instanceof Error ? teamCasesQuery.error.message : "Failed to load cases")
    : null;

  const activeCases = activeTab === "me" ? myCases : teamCases;
  const activeLoading = activeTab === "me" ? myLoading : teamLoading;
  const activeError = activeTab === "me" ? myError : teamError;

  // Background refresh states (has cached data but refetching)
  const activeRefreshing = activeTab === "me"
    ? (myCasesQuery.isFetching && !myCasesQuery.isLoading)
    : (teamCasesQuery.isFetching && !teamCasesQuery.isLoading);

  const isRefreshing =
    (myCasesQuery.isFetching && !myCasesQuery.isLoading) ||
    (teamCasesQuery.isFetching && !teamCasesQuery.isLoading) ||
    (myAggQuery.isFetching && !myAggQuery.isLoading) ||
    (teamAggQuery.isFetching && !teamAggQuery.isLoading) ||
    (notesQuery.isFetching && !notesQuery.isLoading) ||
    (activitiesQuery.isFetching && !activitiesQuery.isLoading);

  const caseNotes = notesQuery.data ?? [];
  const notesLoading = notesQuery.isLoading;
  const notesRefreshing = notesQuery.isFetching && !notesQuery.isLoading;
  const notesError = notesQuery.error
    ? (notesQuery.error instanceof Error ? notesQuery.error.message : "Failed to load notes")
    : null;

  const caseActivities = activitiesQuery.data ?? [];
  const activitiesLoading = activitiesQuery.isLoading;
  const activitiesRefreshing = activitiesQuery.isFetching && !activitiesQuery.isLoading;
  const activitiesError = activitiesQuery.error
    ? (activitiesQuery.error instanceof Error ? activitiesQuery.error.message : "Failed to load activities")
    : null;

  const noteSubmitting = createNoteMutation.isPending;
  const noteSubmitError = createNoteMutation.error
    ? (createNoteMutation.error instanceof Error ? createNoteMutation.error.message : "Failed to create note")
    : null;

  const createSubmitting = createCaseMutation.isPending;
  const createSubmitError = createCaseMutation.error
    ? (createCaseMutation.error instanceof Error ? createCaseMutation.error.message : "Failed to create case")
    : null;

  // ── Handlers ─────────────────────────────────────────────────────

  const fetchCases = useCallback(
    (scope: "me" | "team") => {
      queryClient.invalidateQueries({ queryKey: ["cases", scope] });
      queryClient.invalidateQueries({ queryKey: ["aggStats", scope] });
    },
    [queryClient],
  );

  const fetchCaseNotes = useCallback(
    (incidentId: string, scope: "me" | "team") => {
      queryClient.invalidateQueries({ queryKey: ["caseNotes", incidentId, scope] });
    },
    [queryClient],
  );

  const fetchCaseActivities = useCallback(
    (incidentId: string, scope: "me" | "team") => {
      queryClient.invalidateQueries({ queryKey: ["caseActivities", incidentId, scope] });
    },
    [queryClient],
  );

  const caseHistoryRef = useRef(false);

  const getHashCaseId = (): string | null => {
    const hash = window.location.hash;
    return hash.startsWith("#case/") ? hash.slice(6) : null;
  };

  const pendingCaseIdRef = useRef<string | null>(getHashCaseId());

  const openCase = useCallback(
    (c: Case, _skipNotes?: boolean) => {
      setSelectedCase(c);
      setSelectedCaseScope(activeTab);
      setShowNoteForm(false);
      setNoteSubject("");
      setNoteBody("");
      setActivityTypeFilter("all");
      setSelectedActivity(null);
      createNoteMutation.reset();
      window.history.pushState(
        { view: "case", caseId: c.incidentid, scope: activeTab },
        "",
        `#case/${c.incidentid}`,
      );
      caseHistoryRef.current = true;
    },
    [activeTab, createNoteMutation],
  );

  const closeCase = useCallback(() => {
    setSelectedCase(null);
    setShowNoteForm(false);
    setSelectedActivity(null);
    setActivityTypeFilter("all");
    createNoteMutation.reset();
    if (caseHistoryRef.current) {
      caseHistoryRef.current = false;
      window.history.back();
    } else {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, [createNoteMutation]);

  // Restore case from URL hash on initial load / refresh
  useEffect(() => {
    if (pendingCaseIdRef.current && (myCases.length > 0 || teamCases.length > 0)) {
      const id = pendingCaseIdRef.current;
      pendingCaseIdRef.current = null;
      const myMatch = myCases.find((c) => c.incidentid === id);
      const teamMatch = !myMatch ? teamCases.find((c) => c.incidentid === id) : null;
      const match = myMatch ?? teamMatch;
      const scope: Tab = myMatch ? "me" : "team";
      if (match) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        window.history.pushState(
          { view: "case", caseId: match.incidentid, scope },
          "",
          `#case/${match.incidentid}`,
        );
        setSelectedCase(match);
        setSelectedCaseScope(scope);
        setActiveTab(scope);
        caseHistoryRef.current = true;
      }
    }
  }, [myCases, teamCases]);

  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      const state = e.state;
      if (state?.view === "case" && state.caseId) {
        const pool = state.scope === "team" ? teamCases : myCases;
        const match = pool.find((c) => c.incidentid === state.caseId);
        if (match) {
          setSelectedCase(match);
          setSelectedCaseScope(state.scope ?? "me");
          caseHistoryRef.current = true;
          return;
        }
      }
      caseHistoryRef.current = false;
      setSelectedCase(null);
      setShowNoteForm(false);
      setSelectedActivity(null);
      setActivityTypeFilter("all");
      createNoteMutation.reset();
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [myCases, teamCases, createNoteMutation]);

  const createCaseNote = useCallback(
    (incidentId: string) => {
      createNoteMutation.mutate({
        incidentId,
        subject: noteSubject.trim(),
        body: noteBody.trim(),
      });
    },
    [createNoteMutation, noteSubject, noteBody],
  );

  const createCase = useCallback(() => {
    createCaseMutation.mutate({
      title: createTitle.trim(),
      description: createDescription.trim(),
    });
  }, [createCaseMutation, createTitle, createDescription]);

  const setNoteSubmitError = useCallback(
    (_: string | null) => { if (_ === null) createNoteMutation.reset(); },
    [createNoteMutation],
  );

  const setCreateSubmitError = useCallback(
    (_: string | null) => { if (_ === null) createCaseMutation.reset(); },
    [createCaseMutation],
  );

  // ── Derived UI data ──────────────────────────────────────────────

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
    const agg = activeTab === "me" ? (myAggQuery.data ?? null) : (teamAggQuery.data ?? null);
    if (agg) return agg;

    const active = activeCases.filter((c) => c.statecode === 0).length;
    const resolved = activeCases.filter((c) => c.statecode === 1).length;
    const high = activeCases.filter((c) => c.prioritycode === 1).length;
    return { total: activeCases.length, active, resolved, high };
  }, [activeCases, activeTab, myAggQuery.data, teamAggQuery.data]);

  // ── Sort handler ─────────────────────────────────────────────────

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
    activeRefreshing,
    activeError,
    isRefreshing,
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
    notesRefreshing,
    notesError,
    fetchCaseNotes,

    // Activities
    caseActivities,
    activitiesLoading,
    activitiesRefreshing,
    activitiesError,
    activityTypeFilter,
    setActivityTypeFilter,
    selectedActivity,
    setSelectedActivity,
    fetchCaseActivities,

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

    // Create case form
    showCreateForm,
    setShowCreateForm,
    createTitle,
    setCreateTitle,
    createDescription,
    setCreateDescription,
    createSubmitting,
    createSubmitError,
    setCreateSubmitError,
    createCase,
  };
}
