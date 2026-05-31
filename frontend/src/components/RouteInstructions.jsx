import { useState } from "react";

// Tiny inline arrow icons (stroke uses currentColor → white on the badge).
const ICONS = {
  start: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
    </svg>
  ),
  end: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3v18" />
      <path d="M5 4h11l-2 3 2 3H5" fill="currentColor" stroke="none" />
    </svg>
  ),
  left: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6 3 12l6 6" />
      <path d="M3 12h12a4 4 0 0 1 4 4v2" />
    </svg>
  ),
  right: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 6 6 6-6 6" />
      <path d="M21 12H9a4 4 0 0 0-4 4v2" />
    </svg>
  ),
  merge: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21V8" />
      <path d="M5 13 12 6l7 7" />
    </svg>
  ),
  straight: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20V5" />
      <path d="m6 11 6-6 6 6" />
    </svg>
  ),
};

// Classify a maneuver from its instruction text → badge color + icon.
function kindFor(text, isFirst, isLast) {
  const t = text.toLowerCase();
  if (isLast || t.includes("arrive")) return "end";
  if (isFirst || t.startsWith("head out") || t.startsWith("depart")) return "start";
  if (t.includes("merge") || t.includes("ramp")) return "merge";
  if (t.includes("left")) return "left";
  if (t.includes("right")) return "right";
  return "straight";
}

// Bold the road name (everything after "onto"/"on") for quicker scanning.
function renderText(text) {
  const m = text.match(/^(.*?\b(?:onto|on)\s)(.+)$/i);
  if (!m) return text;
  return (
    <>
      {m[1]}
      <span className="dir-road">{m[2]}</span>
    </>
  );
}

function Leg({ title, from, to, steps }) {
  const total = steps.reduce((a, s) => a + (s.distance_miles || 0), 0);
  return (
    <div className="dir-leg">
      <div className="dir-leg-head">
        <h3>{title}</h3>
        <span className="dir-leg-sub">
          {from} → {to} · {Math.round(total)} mi · {steps.length} steps
        </span>
      </div>
      <ol className="dir-list">
        {steps.map((s, i) => {
          const kind = kindFor(s.text, i === 0, i === steps.length - 1);
          return (
            <li key={i} className="dir-step">
              <span className={`dir-badge ${kind}`} aria-hidden="true">
                {ICONS[kind]}
              </span>
              <span className="dir-body">
                <span className="dir-text">{renderText(s.text)}</span>
                {s.distance_miles >= 0.1 && (
                  <span className="dir-dist">{s.distance_miles} mi</span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function RouteInstructions({ plan }) {
  const [open, setOpen] = useState(false);
  const legs = plan.route?.legs || [];
  const hasSteps = legs.some((l) => (l.steps || []).length);
  if (!hasSteps) return null;

  const city = (loc) => (loc ? loc.split(",")[0].trim() : "—");
  const cur = city(plan.locations?.current?.name);
  const pick = city(plan.locations?.pickup?.name);
  const drop = city(plan.locations?.dropoff?.name);

  const titles = [
    { title: "Leg 1 — Drive to pickup", from: cur, to: pick },
    { title: "Leg 2 — Drive to drop-off", from: pick, to: drop },
  ];

  return (
    <div className="card">
      <div className="card-header">
        <h2>Turn-by-Turn Directions</h2>
        <span className="sub">OSRM · driving</span>
      </div>
      <div className="card-body">
        <button
          type="button"
          className="btn secondary dir-toggle"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Hide directions" : "Show directions"}
        </button>

        {open && (
          <div className="dir-wrap">
            {legs.map((leg, i) => (
              <Leg
                key={i}
                title={titles[i]?.title || `Leg ${i + 1}`}
                from={titles[i]?.from || ""}
                to={titles[i]?.to || ""}
                steps={leg.steps || []}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
