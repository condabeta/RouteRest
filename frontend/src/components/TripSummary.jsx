import { fmtHours } from "../utils";

export default function TripSummary({ summary }) {
  const stats = [
    { value: Math.round(summary.total_distance_miles), unit: "mi", label: "Distance" },
    { value: fmtHours(summary.total_driving_hours), label: "Driving time" },
    { value: fmtHours(summary.total_on_duty_hours), label: "On-duty time" },
    { value: summary.number_of_days, label: "Log days" },
    { value: summary.fuel_stops, label: "Fuel stops" },
    { value: summary.rest_stops, label: "10h rests" },
    {
      value: summary.cycle_used_end,
      unit: "/70 hrs",
      label: "Cycle used (end)",
    },
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
              <div className="value">
                {s.value}
                {s.unit && <small> {s.unit}</small>}
              </div>
              <div className="label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
