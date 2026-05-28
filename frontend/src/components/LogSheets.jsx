import { useState } from "react";
import LogSheet from "./LogSheet";

export default function LogSheets({ dailyLogs }) {
  const [active, setActive] = useState(0);
  const [showAll, setShowAll] = useState(false);

  if (!dailyLogs?.length) return null;

  return (
    <div className="card">
      <div className="card-header">
        <h2>Daily Log Sheets</h2>
        <span className="sub">
          {dailyLogs.length} day{dailyLogs.length > 1 ? "s" : ""} · FMCSA RODS
        </span>
      </div>
      <div className="card-body">
        <div className="print-btn-row" style={{ gap: 8 }}>
          <button
            className="btn secondary"
            style={{ width: "auto", padding: "8px 14px" }}
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? "Show one day" : "Show all days"}
          </button>
          <button
            className="btn secondary"
            style={{ width: "auto", padding: "8px 14px" }}
            onClick={() => window.print()}
          >
            🖨 Print logs
          </button>
        </div>

        {!showAll && (
          <div className="day-tabs">
            {dailyLogs.map((d, i) => (
              <button
                key={d.date}
                className={`day-tab ${i === active ? "active" : ""}`}
                onClick={() => setActive(i)}
              >
                Day {i + 1}
                <small>{d.date}</small>
              </button>
            ))}
          </div>
        )}

        {showAll
          ? dailyLogs.map((d, i) => (
              <LogSheet
                key={d.date}
                day={d}
                index={i}
                total={dailyLogs.length}
              />
            ))
          : (
              <LogSheet
                day={dailyLogs[active]}
                index={active}
                total={dailyLogs.length}
              />
            )}
      </div>
    </div>
  );
}
