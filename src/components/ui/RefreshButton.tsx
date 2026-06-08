interface RefreshButtonProps {
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  label?: string;
}

export function RefreshButton({ loading, refreshing, onRefresh, label = "Refresh" }: RefreshButtonProps) {
  return (
    <button
      onClick={onRefresh}
      disabled={loading}
      className="px-3 py-1.5 text-xs rounded-lg border border-tn-border bg-white
        text-tn-slate hover:bg-tn-bg transition-colors cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
    >
      <svg
        className={`w-3.5 h-3.5 ${refreshing ? "text-tn-sky" : ""}`}
        style={refreshing ? { animation: "spin 1s linear infinite" } : undefined}
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      {loading ? "Loading..." : label}
    </button>
  );
}
