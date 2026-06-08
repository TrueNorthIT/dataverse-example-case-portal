import type { AppUser } from "../env";

interface HeaderProps {
  user?: AppUser;
  realtimeConnected?: boolean;
  onLogout: () => void;
}

export function Header({ user, realtimeConnected, onLogout }: HeaderProps) {
  return (
    <header className="bg-tn-navy text-white shadow-md">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-tn-sky" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span className="font-bold text-base">Case Portal</span>
          {realtimeConnected != null && (
            <span
              className="flex items-center gap-1 text-[0.6rem] text-tn-sky/60"
              title={realtimeConnected ? "Real-time updates active" : "Real-time updates disconnected"}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${realtimeConnected ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
              <span className="hidden sm:inline">{realtimeConnected ? "Live" : "Connecting"}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-tn-sky/80">{user?.email}</span>
          <button
            className="px-3 py-1.5 text-xs rounded-md border border-white/30
              bg-transparent text-white hover:bg-white/10 transition-colors cursor-pointer"
            onClick={onLogout}
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
