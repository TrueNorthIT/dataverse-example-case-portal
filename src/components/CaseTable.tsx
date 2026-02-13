import type { Case, SortField, SortDir, GroupBy } from "../types/case";
import { formatDate } from "../utils/format";
import { statusColor, priorityBadge } from "../utils/style";

interface CaseTableProps {
  sorted: Case[];
  grouped: Map<string, Case[]> | null;
  groupBy: GroupBy;
  expandedGroups: Set<string>;
  onToggleGroup: (key: string) => void;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  onSelectCase: (c: Case) => void;
  activeLoading: boolean;
  activeError: string | null;
  activeCasesCount: number;
  filteredCount: number;
  searchQuery: string;
  onClearSearch: () => void;
  onRetry: () => void;
}

export function CaseTable({
  sorted,
  grouped,
  groupBy,
  expandedGroups,
  onToggleGroup,
  sortField,
  sortDir,
  onSort,
  onSelectCase,
  activeLoading,
  activeError,
  activeCasesCount,
  filteredCount,
  searchQuery,
  onClearSearch,
  onRetry,
}: CaseTableProps) {
  // Error state
  if (activeError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-red-800">Failed to load cases</p>
          <p className="text-xs text-red-600 mt-0.5">{activeError}</p>
          <button
            className="mt-2 text-xs text-red-700 underline cursor-pointer bg-transparent border-none p-0"
            onClick={onRetry}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Loading skeleton
  if (activeLoading) {
    return (
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
    );
  }

  // Empty state
  if (activeCasesCount === 0) {
    return (
      <div className="bg-white rounded-xl border border-tn-border shadow-sm p-12 text-center">
        <svg className="w-16 h-16 text-tn-border mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <h3 className="text-lg font-semibold text-tn-navy mb-1">No cases found</h3>
        <p className="text-sm text-tn-muted">No cases are available.</p>
      </div>
    );
  }

  // No search results
  if (filteredCount === 0) {
    return (
      <div className="bg-white rounded-xl border border-tn-border shadow-sm p-8 text-center">
        <p className="text-sm text-tn-muted">No cases match your search.</p>
        <button
          className="mt-2 text-xs text-tn-teal underline cursor-pointer bg-transparent border-none p-0"
          onClick={onClearSearch}
        >
          Clear search
        </button>
      </div>
    );
  }

  const tableHead = (
    <tr className="border-b border-tn-border bg-tn-bg/50 text-tn-slate">
      <SortHeader field="ticketnumber" label="Case #" className="w-44" sortField={sortField} sortDir={sortDir} onSort={onSort} />
      <SortHeader field="title" label="Title" sortField={sortField} sortDir={sortDir} onSort={onSort} />
      <SortHeader field="statuscode" label="Status" className="w-36" sortField={sortField} sortDir={sortDir} onSort={onSort} />
      <SortHeader field="prioritycode" label="Priority" className="w-28" sortField={sortField} sortDir={sortDir} onSort={onSort} />
      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-28">Type</th>
      <SortHeader field="createdon" label="Created" className="w-28" sortField={sortField} sortDir={sortDir} onSort={onSort} />
      <SortHeader field="modifiedon" label="Modified" className="w-28" sortField={sortField} sortDir={sortDir} onSort={onSort} />
    </tr>
  );

  // Ungrouped table
  if (groupBy === "none") {
    return (
      <div className="bg-white rounded-xl border border-tn-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>{tableHead}</thead>
            <tbody>
              {sorted.map((c) => (
                <CaseRow key={c.incidentid} c={c} onSelect={onSelectCase} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Grouped tables
  if (!grouped || grouped.size === 0) return null;

  return (
    <div className="space-y-3">
      {Array.from(grouped.entries()).map(([groupLabel, cases]) => {
        const isExpanded = expandedGroups.has(groupLabel);
        return (
          <div key={groupLabel} className="bg-white rounded-xl border border-tn-border shadow-sm overflow-hidden">
            <button
              className="w-full px-5 py-3 flex items-center justify-between bg-tn-bg/50
                hover:bg-tn-bg transition-colors cursor-pointer border-none text-left"
              onClick={() => onToggleGroup(groupLabel)}
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

            {isExpanded && (
              <div className="overflow-x-auto border-t border-tn-border/50">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-tn-border/50 bg-tn-bg/30 text-tn-slate">
                      <SortHeader field="ticketnumber" label="Case #" className="w-44" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                      <SortHeader field="title" label="Title" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                      <SortHeader field="statuscode" label="Status" className="w-36" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                      <SortHeader field="prioritycode" label="Priority" className="w-28" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-28">Type</th>
                      <SortHeader field="createdon" label="Created" className="w-28" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                      <SortHeader field="modifiedon" label="Modified" className="w-28" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                    </tr>
                  </thead>
                  <tbody>
                    {cases.map((c) => (
                      <CaseRow key={c.incidentid} c={c} onSelect={onSelectCase} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────

function SortHeader({
  field,
  label,
  className,
  sortField,
  sortDir,
  onSort,
}: {
  field: SortField;
  label: string;
  className?: string;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
}) {
  const isActive = sortField === field;
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer
        select-none transition-colors hover:bg-tn-navy/5 ${className ?? ""}`}
      onClick={() => onSort(field)}
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

function CaseRow({ c, onSelect }: { c: Case; onSelect: (c: Case) => void }) {
  const sc = statusColor(c.statecode);
  const pb = priorityBadge(c.prioritycode);

  return (
    <tr
      className="border-b border-tn-border/50 hover:bg-tn-sky/5 transition-colors cursor-pointer"
      onClick={() => onSelect(c)}
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
