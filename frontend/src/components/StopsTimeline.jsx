import { fmtDateTime, fmtHours, STOP_META } from "../utils";

const KIND_LABEL = {
  start: "Start",
  pickup: "Pickup",
  dropoff: "Drop-off",
  fuel: "Fuel",
  rest: "Rest",
  break: "Break",
};

export default function StopsTimeline({ stops }) {
  return (
    <div className="card">
      <div className="card-header">
        <h2>Itinerary & Stops</h2>
        <span className="sub">{stops.length} events</span>
      </div>
      <div className="card-body">
        <ul className="timeline">
          {stops.map((stop, i) => {
            const meta = STOP_META[stop.kind] || { color: "#64748b", icon: "•" };
            const duration =
              (new Date(stop.depart) - new Date(stop.arrive)) / 3600000;
            return (
              <li key={i}>
                <div className="tl-dot" style={{ background: meta.color }}>
                  {meta.icon}
                </div>
                <div className="tl-body">
                  <div className="tl-title">{stop.label}</div>
                  <div className="tl-meta">
                    {stop.location ? stop.location.split(",").slice(0, 2).join(", ") : ""}
                    {duration > 0.01 && (
                      <> · stops {fmtHours(duration)}</>
                    )}
                    {" · "}
                    {Math.round(stop.distance_miles)} mi
                  </div>
                </div>
                <div className="tl-time">{fmtDateTime(stop.arrive)}</div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
