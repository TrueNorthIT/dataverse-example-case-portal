import { useState, useMemo, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@truenorth-it/dataverse-client";
import { useDataverseList } from "./useDataverseList";
import { useDataverseAggregate } from "./useDataverseAggregate";
import { CASE_TABLE, CASE_FIELDS, type Case } from "../tables/case";
import type { Tab, SortField, SortDir, GroupBy } from "../types/ui";
import { compareCases } from "../utils/style";

type AggRow = { statecode: number; prioritycode: number; count: number };

export interface CaseStats {
  total: number;
  active: number;
  resolved: number;
  high: number;
}

function computeStats(rows: AggRow[]): CaseStats {
  let total = 0, active = 0, resolved = 0, high = 0;
  for (const r of rows) {
    total += r.count;
    if (r.statecode === 0) active += r.count;
    if (r.statecode === 1) resolved += r.count;
    if (r.prioritycode === 1) high += r.count;
  }
  return { total, active, resolved, high };
}

/**
 * State + queries for the case list view: my/team data, dashboard stats,
 * and the toolbar UI (tab, search, sort, group).
 *
 * The two queries (`my` / `team`) come from one generic hook — this is the
 * pattern any new entity can copy.
 */
export function useCaseList() {
  const queryClient = useQueryClient();

  const my = useDataverseList<Case>(CASE_TABLE, "me", {
    select: CASE_FIELDS,
    top: 200,
    orderBy: "modifiedon:desc",
  });

  const team = useDataverseList<Case>(CASE_TABLE, "team", {
    select: CASE_FIELDS,
    top: 200,
    orderBy: "modifiedon:desc",
  });

  const teamAvailable = !(team.error instanceof ApiError && team.error.status === 403);

  const myAgg = useDataverseAggregate<AggRow>(CASE_TABLE, "me", {
    aggregate: "count",
    groupBy: ["statecode", "prioritycode"],
  });

  const teamAgg = useDataverseAggregate<AggRow>(CASE_TABLE, "team", {
    aggregate: "count",
    groupBy: ["statecode", "prioritycode"],
    enabled: teamAvailable,
  });

  // ── Toolbar state ──────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>("me");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("modifiedon");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // ── Derived data ──────────────────────────────────────────────────
  const activeCases = activeTab === "me" ? my.data : team.data;
  const activeLoading = activeTab === "me" ? my.isLoading : team.isLoading;
  const activeRefreshing = activeTab === "me" ? my.isRefreshing : team.isRefreshing;
  const activeError = activeTab === "me" ? my.errorMessage : team.errorMessage;

  const isRefreshing =
    my.isRefreshing || team.isRefreshing ||
    myAgg.isRefreshing || teamAgg.isRefreshing;

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
      const key = (c[`${groupBy}_label` as keyof Case] as string) ?? "Unknown";
      const bucket = map.get(key) ?? [];
      bucket.push(c);
      map.set(key, bucket);
    }
    return map;
  }, [sorted, groupBy]);

  // Reset expanded groups when group/tab changes
  useEffect(() => {
    if (grouped) setExpandedGroups(new Set(grouped.keys()));
  }, [groupBy, activeTab]);

  const stats: CaseStats = useMemo(() => {
    const agg = activeTab === "me" ? myAgg.data : teamAgg.data;
    if (agg.length > 0) return computeStats(agg);
    // Fallback while aggregate is loading
    return {
      total: activeCases.length,
      active: activeCases.filter((c) => c.statecode === 0).length,
      resolved: activeCases.filter((c) => c.statecode === 1).length,
      high: activeCases.filter((c) => c.prioritycode === 1).length,
    };
  }, [activeCases, activeTab, myAgg.data, teamAgg.data]);

  const handleSort = useCallback((field: SortField) => {
    setSortField((prevField) => {
      if (prevField === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prevField;
      }
      setSortDir(field === "createdon" || field === "modifiedon" ? "desc" : "asc");
      return field;
    });
  }, []);

  const toggleGroup = useCallback((key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const refreshActive = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [CASE_TABLE, activeTab] });
    queryClient.invalidateQueries({ queryKey: ["agg", CASE_TABLE, activeTab] });
  }, [queryClient, activeTab]);

  return {
    // Queries
    my,
    team,
    teamAvailable,
    activeCases,
    activeLoading,
    activeRefreshing,
    activeError,
    isRefreshing,

    // Toolbar state
    activeTab, setActiveTab,
    searchQuery, setSearchQuery,
    sortField, sortDir, handleSort,
    groupBy, setGroupBy,
    expandedGroups, toggleGroup,

    // Derived
    filtered, sorted, grouped, stats,

    refreshActive,
  };
}
