import { fmtHours } from "../utils";

const I = {
  distance: (
    <path d="M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-.553-.894L15 4m0 13V4m0 0L9 7" />
  ),
  wheel: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v6m0 6v6m9-9h-6m-6 0H3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  fuel: (
    <>
      <path d="M3 22V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v18" />
      <path d="M3 10h10M13 6l4 2v9a2 2 0 0 0 4 0V9l-4-4" />
    </>
  ),
  bed: (
    <>
      <path d="M2 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M2 14h20M6 10V7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
    </>
  ),
  gauge: (
    <>
      <path d="M12 14l4-4M3.34 19a10 10 0 1 1 17.32 0" />
    </>
  ),
};

export default function TripSummary({ summary }) {
  const stats = [
    { icon: I.distance, color: "#3b82f6", value: Math.round(summary.total_distance_miles), unit: "mi", label: "Distance" },
    { icon: I.wheel, color: "#6366f1", value: fmtHours(summary.total_driving_hours), label: "Driving time" },
    { icon: I.clock, color: "#0ea5e9", value: fmtHours(summary.total_on_duty_hours), label: "On-duty time" },
    { icon: I.calendar, color: "#10b981", value: summary.number_of_days, label: "Log days" },
    { icon: I.fuel, color: "#f59e0b", value: summary.fuel_stops, label: "Fuel stops" },
    { icon: I.bed, color: "#8b5cf6", value: summary.rest_stops, label: "10h rests" },
    { icon: I.gauge, color: "#ef4444", value: summary.cycle_used_end, unit: "/70 hrs", label: "Cycle used (end)" },
  ];

  return (
    <div className="card">
      <div className="card-header">
        <h2>Trip Summary</h2>
        <span className="sub">
          {fmtHours(summary.total_duration_hours)} total · {summary.average_speed_mph} mph avg
        </span>
      </div>
      <div className="card-body">
        <div className="stats">
          {stats.map((s) => (
            <div className="stat" key={s.label}>
              <div className="stat-icon" style={{ background: s.color }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {s.icon}
                </svg>
              </div>
              <div>
                <div className="value">
                  {s.value}
                  {s.unit && <small> {s.unit}</small>}
                </div>
                <div className="label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
