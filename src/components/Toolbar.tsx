import type { Tab, GroupBy } from "../types/case";

interface ToolbarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  teamAvailable: boolean;
  myCasesCount: number;
  teamCasesCount: number;
  myLoading: boolean;
  teamLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  groupBy: GroupBy;
  onGroupByChange: (groupBy: GroupBy) => void;
  activeLoading: boolean;
  onRefresh: () => void;
  filteredCount: number;
  totalCount: number;
  onNewCase: () => void;
}

export function Toolbar({
  activeTab,
  onTabChange,
  teamAvailable,
  myCasesCount,
  teamCasesCount,
  myLoading,
  teamLoading,
  searchQuery,
  onSearchChange,
  groupBy,
  onGroupByChange,
  activeLoading,
  onRefresh,
  filteredCount,
  totalCount,
  onNewCase,
}: ToolbarProps) {
  return (
    <div className="bg-white rounded-xl border border-tn-border shadow-sm mb-4">
      <div className="p-4 flex flex-wrap items-center gap-3">
        {/* Tabs */}
        <div className="inline-flex rounded-lg border border-tn-border overflow-hidden">
          <button
            className={`px-4 py-2 text-xs font-semibold transition-colors cursor-pointer border-none
              ${activeTab === "me" ? "bg-tn-navy text-white" : "bg-white text-tn-slate hover:bg-tn-bg"}`}
            onClick={() => onTabChange("me")}
          >
            My Cases
            {!myLoading && <span className="ml-1.5 opacity-60">({myCasesCount})</span>}
          </button>
          {teamAvailable && (
            <button
              className={`px-4 py-2 text-xs font-semibold transition-colors cursor-pointer border-none border-l border-tn-border
                ${activeTab === "team" ? "bg-tn-navy text-white" : "bg-white text-tn-slate hover:bg-tn-bg"}`}
              onClick={() => onTabChange("team")}
            >
              Team Cases
              {!teamLoading && <span className="ml-1.5 opacity-60">({teamCasesCount})</span>}
            </button>
          )}
        </div>

        {/* New Case — only on My Cases tab */}
        {activeTab === "me" && (
          <button
            className="px-3 py-2 text-xs rounded-lg border border-tn-sky bg-tn-sky/10
              text-tn-navy font-semibold hover:bg-tn-sky/20 transition-colors cursor-pointer"
            onClick={onNewCase}
          >
            + New Case
          </button>
        )}

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
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-tn-border bg-tn-bg/50
              focus:outline-none focus:ring-2 focus:ring-tn-sky/50 focus:border-tn-sky
              placeholder:text-tn-muted/60"
          />
          {searchQuery && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-tn-muted hover:text-tn-navy
                cursor-pointer bg-transparent border-none p-0"
              onClick={() => onSearchChange("")}
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
            onChange={(e) => onGroupByChange(e.target.value as GroupBy)}
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
          onClick={onRefresh}
        >
          {activeLoading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* Filter summary */}
      {searchQuery && (
        <div className="px-4 pb-3 text-xs text-tn-muted">
          Showing {filteredCount} of {totalCount} cases matching "{searchQuery}"
        </div>
      )}
    </div>
  );
}
