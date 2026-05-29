const STEPS = [
  {
    n: 1,
    title: "Enter your trip",
    text: "Type your current, pickup and drop-off cities, plus the on-duty hours you've already used this cycle.",
  },
  {
    n: 2,
    title: "We apply the HOS rules",
    text: "RouteRest simulates the drive and inserts every required break, fuel stop and rest period under FMCSA 49 CFR §395.",
  },
  {
    n: 3,
    title: "Get your route & logs",
    text: "See the mapped route with all stops and download fully-drawn daily ELD log sheets — one per day.",
  },
];

const FEATURES = [
  { color: "#3b82f6", title: "11-hour driving limit", text: "Max 11 hrs driving per shift before a 10-hour reset." },
  { color: "#6366f1", title: "14-hour window", text: "No driving past 14 hours after coming on duty." },
  { color: "#0ea5e9", title: "30-minute break", text: "Inserted after 8 cumulative hours of driving." },
  { color: "#10b981", title: "70hr / 8-day cycle", text: "Tracks your rolling cycle from the hours you enter." },
  { color: "#8b5cf6", title: "34-hour restart", text: "Added automatically when the weekly cycle runs out." },
  { color: "#f59e0b", title: "Fuel every 1,000 mi", text: "A fueling stop is scheduled at least every 1,000 miles." },
];

function Step({ n, title, text }) {
  return (
    <div className="step">
      <div className="step-n">{n}</div>
      <div>
        <div className="step-title">{title}</div>
        <div className="step-text">{text}</div>
      </div>
    </div>
  );
}

export default function LandingInfo() {
  return (
    <div className="landing">
      <div className="card landing-hero">
        <div className="landing-hero-body">
          <span className="kicker">Hours-of-Service planner</span>
          <h2>Plan a compliant trip in seconds.</h2>
          <p>
            Fill in the route above and RouteRest maps your drive with every
            mandatory stop, then draws the FMCSA daily log sheets for you — no
            manual plotting, no math.
          </p>
          <div className="landing-points">
            <span>✓ Free maps & routing</span>
            <span>✓ Multi-day log sheets</span>
            <span>✓ Print-ready output</span>
          </div>
        </div>
        <div className="landing-hero-art">
          <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#1e3a5f" />
                <stop offset="1" stopColor="#0a1424" />
              </linearGradient>
            </defs>
            <rect width="240" height="200" rx="16" fill="url(#lg)" />
            {/* dashed route */}
            <path d="M40 150 C 80 150, 70 70, 120 70 S 180 120, 200 50" stroke="#f59e0b" strokeWidth="3" strokeDasharray="7 7" fill="none" />
            <circle cx="40" cy="150" r="7" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
            <circle cx="120" cy="70" r="7" fill="#10b981" stroke="#fff" strokeWidth="2" />
            <circle cx="200" cy="50" r="7" fill="#ef4444" stroke="#fff" strokeWidth="2" />
            {/* mini grid */}
            <g opacity="0.85">
              <rect x="36" y="168" width="168" height="22" rx="4" fill="#0f1e36" stroke="#334155" />
              {Array.from({ length: 13 }).map((_, i) => (
                <line key={i} x1={36 + i * 14} y1="168" x2={36 + i * 14} y2="190" stroke="#334155" strokeWidth="0.7" />
              ))}
              <path d="M36 184 L78 184 L78 174 L120 174 L120 180 L162 180 L162 172 L204 172" stroke="#f59e0b" strokeWidth="2" fill="none" />
            </g>
          </svg>
        </div>
      </div>

      <div className="card landing-steps-card">
        <div className="card-header">
          <h2>How it works</h2>
        </div>
        <div className="card-body steps">
          {STEPS.map((s) => (
            <Step key={s.n} {...s} />
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>What RouteRest enforces</h2>
          <span className="sub">Property carrier · 70hr / 8day</span>
        </div>
        <div className="card-body">
          <div className="feature-grid">
            {FEATURES.map((f) => (
              <div className="feature" key={f.title}>
                <span className="feature-bar" style={{ background: f.color }} />
                <div>
                  <div className="feature-title">{f.title}</div>
                  <div className="feature-text">{f.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
