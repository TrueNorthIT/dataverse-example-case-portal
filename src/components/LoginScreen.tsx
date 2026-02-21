interface LoginScreenProps {
  onLogin: () => void;
}

function LogoSvg() {
  return (
    <svg viewBox="0 0 300 300" className="logo-svg">
      <rect className="bar bar-left" x="64.3" y="225.5" width="75" height="10.7" fill="currentColor" style={{ animationDelay: "0ms" }} />
      <rect className="bar bar-right" x="160.7" y="225.5" width="75" height="10.7" fill="currentColor" style={{ animationDelay: "110ms" }} />
      <rect className="bar bar-left" x="64.3" y="193.4" width="75" height="10.7" fill="currentColor" style={{ animationDelay: "220ms" }} />
      <rect className="bar bar-right" x="160.7" y="193.4" width="75" height="10.7" fill="currentColor" style={{ animationDelay: "330ms" }} />
      <rect className="bar bar-left" x="64.3" y="161.2" width="75" height="10.7" fill="currentColor" style={{ animationDelay: "440ms" }} />
      <rect className="bar bar-right" x="160.7" y="161.2" width="75" height="10.7" fill="currentColor" style={{ animationDelay: "550ms" }} />
      <rect className="bar bar-left" x="64.3" y="129.1" width="75" height="10.7" fill="currentColor" style={{ animationDelay: "660ms" }} />
      <rect className="bar bar-right" x="160.7" y="129.1" width="75" height="10.7" fill="currentColor" style={{ animationDelay: "770ms" }} />
      <rect className="bar bar-left" x="64.3" y="96.9" width="75" height="10.7" fill="currentColor" style={{ animationDelay: "880ms" }} />
      <rect className="bar bar-right" x="160.7" y="96.9" width="75" height="10.7" fill="currentColor" style={{ animationDelay: "990ms" }} />
      <rect className="bar bar-capstone" x="64.3" y="64.8" width="171.4" height="10.7" fill="currentColor" style={{ animationDelay: "1150ms" }} />
    </svg>
  );
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  return (
    <div className="min-h-screen bg-tn-navy flex flex-col items-center justify-center font-sans">
      <div className="loading-logo">
        <div className="logo-wrap">
          <div className="logo-box" />
          <div className="logo-shimmer-clip">
            <div className="logo-shimmer" />
          </div>
          <LogoSvg />
        </div>
      </div>
      <h1
        className="text-3xl font-bold text-white mt-6"
        style={{ opacity: 0, animation: "fade-up .5s ease-out 1950ms forwards" }}
      >
        Case Portal
      </h1>
      <p
        className="text-base leading-relaxed mt-2 mb-8"
        style={{ color: "rgba(128,208,222,.55)", opacity: 0, animation: "fade-up .5s ease-out 2100ms forwards" }}
      >
        View and track your support cases. Sign in to get started.
      </p>
      <div style={{ opacity: 0, animation: "fade-up .5s ease-out 2300ms forwards" }}>
        <button
          className="px-8 py-3 rounded-lg bg-tn-sky text-tn-navy font-semibold text-sm
            hover:bg-tn-sky-light transition-all cursor-pointer shadow-lg
            hover:-translate-y-0.5"
          style={{ boxShadow: "0 4px 24px rgba(128,208,222,.2)" }}
          onClick={onLogin}
        >
          Sign in
        </button>
      </div>
    </div>
  );
}
