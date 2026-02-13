import type { User } from "@auth0/auth0-react";

interface HeaderProps {
  user?: User;
  onLogout: () => void;
}

export function Header({ user, onLogout }: HeaderProps) {
  return (
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
            onClick={onLogout}
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
