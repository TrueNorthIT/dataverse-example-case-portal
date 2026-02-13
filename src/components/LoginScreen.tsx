interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
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
          onClick={onLogin}
        >
          Sign in
        </button>
      </div>
    </div>
  );
}
