import { useState } from "react";

// Pick a small directional glyph for a maneuver from its instruction text.
function arrowFor(text) {
  const t = text.toLowerCase();
  if (t.startsWith("head out") || t.startsWith("depart")) return "↑";
  if (t.includes("arrive")) return "■";
  if (t.includes("u-turn")) return "↩";
  if (t.includes("slightly left")) return "↖";
  if (t.includes("sharp left")) return "↰";
  if (t.includes("left")) return "←";
  if (t.includes("slightly right")) return "↗";
  if (t.includes("sharp right")) return "↱";
  if (t.includes("right")) return "→";
  if (t.includes("roundabout")) return "⟳";
  if (t.includes("merge") || t.includes("ramp")) return "⤳";
  return "↑";
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
        {steps.map((s, i) => (
          <li key={i} className="dir-step">
            <span className="dir-arrow" aria-hidden="true">
              {arrowFor(s.text)}
            </span>
            <span className="dir-text">{s.text}</span>
            {s.distance_miles >= 0.1 && (
              <span className="dir-dist">{s.distance_miles} mi</span>
            )}
          </li>
        ))}
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
