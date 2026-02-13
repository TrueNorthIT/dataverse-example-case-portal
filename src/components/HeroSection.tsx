import type { StatFilter } from "../types/case";

interface Stats {
  total: number;
  active: number;
  resolved: number;
  high: number;
}

interface HeroSectionProps {
  firstName: string;
  stats: Stats;
  loading: boolean;
  activeFilter: StatFilter;
  onFilterChange: (key: StatFilter) => void;
}

const STAT_CARDS = [
  { key: "total" as const, label: "Total Cases", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
  { key: "active" as const, label: "Active", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  { key: "resolved" as const, label: "Resolved", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  { key: "high" as const, label: "High Priority", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" },
];

export function HeroSection({ firstName, stats, loading, activeFilter, onFilterChange }: HeroSectionProps) {
  return (
    <div className="bg-gradient-to-r from-tn-navy via-tn-navy-light to-tn-navy">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-white mb-1">
          Welcome back, {firstName}
        </h1>
        <p className="text-tn-sky/70 text-sm">
          Here's an overview of your support cases
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          {STAT_CARDS.map((s) => {
            const isActive = activeFilter === s.key;
            return (
              <button
                key={s.label}
                type="button"
                onClick={() => onFilterChange(s.key)}
                className={`text-left rounded-xl px-4 py-3 border backdrop-blur-sm transition-all cursor-pointer ${
                  isActive
                    ? "bg-white/25 border-tn-sky ring-2 ring-tn-sky/40"
                    : "bg-white/10 border-white/10 hover:bg-white/15 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <svg className={`w-4 h-4 ${isActive ? "text-tn-sky" : "text-tn-sky/60"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                  </svg>
                  <span className={`text-[11px] uppercase tracking-wider font-medium ${isActive ? "text-tn-sky" : "text-tn-sky/60"}`}>{s.label}</span>
                </div>
                <span className="text-2xl font-bold text-white">
                  {loading ? "—" : stats[s.key]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
