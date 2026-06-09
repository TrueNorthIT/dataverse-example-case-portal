export function LoadingSplash() {
  return (
    <div className="min-h-screen bg-tn-navy flex flex-col items-center justify-center font-sans">
      <div className="loading-logo">
        <div className="logo-wrap">
          <div className="logo-box" />
          <div className="logo-shimmer-clip">
            <div className="logo-shimmer" />
          </div>
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
        </div>
      </div>
      <h1
        className="text-white text-2xl font-bold mt-6"
        style={{ opacity: 0, animation: "fade-up .5s ease-out 1950ms forwards" }}
      >
        Case Portal
      </h1>
      <p
        className="text-sm mt-1"
        style={{ color: "rgba(128,208,222,.55)", opacity: 0, animation: "fade-up .5s ease-out 2100ms forwards" }}
      >
        Loading…
      </p>
    </div>
  );
}
