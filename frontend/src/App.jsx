import { useState } from "react";
import TripForm from "./components/TripForm";
import RouteMap from "./components/RouteMap";
import TripSummary from "./components/TripSummary";
import StopsTimeline from "./components/StopsTimeline";
import LogSheets from "./components/LogSheets";
import { planTrip } from "./api";

function TruckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0b1729" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 17h4V5H2v12h3" />
      <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1" />
      <circle cx="7.5" cy="17.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  );
}

export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async (payload) => {
    setLoading(true);
    setError("");
    try {
      const data = await planTrip(payload);
      setResult(data);
      // Scroll results into view on small screens.
      setTimeout(() => {
        document
          .getElementById("results-top")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (e) {
      setError(e.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const plan = result?.plan;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="logo">
            <TruckIcon />
          </div>
          <div>
            <h1>RouteRest</h1>
            <p className="tagline">HOS-compliant trip planner & ELD logs</p>
          </div>
        </div>
        <span className="badge">FMCSA 49 CFR §395 · 70hr / 8day</span>
      </header>

      <div className="container1">
        <TripForm onSubmit={handleSubmit} loading={loading} />

        <div className="results" id="results-top">
          {error && <div className="error-box top-error">{error}</div>}

          {!plan && !error && (
            <div className="card">
              <div className="placeholder">
                <div className="big-icon">
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <h3>Plan your first trip</h3>
                <p>
                  Enter your locations and current cycle hours above, and we'll
                  map the route with required rest stops and draw your daily ELD
                  log sheets.
                </p>
              </div>
            </div>
          )}

          {plan && (
            <>
              <TripSummary summary={plan.summary} />
              <div className="card">
                <div className="card-header">
                  <h2>Route Map</h2>
                  <span className="sub">
                    OpenStreetMap · {Math.round(plan.summary.total_distance_miles)} mi
                  </span>
                </div>
                <RouteMap plan={plan} />
              </div>
              <StopsTimeline stops={plan.stops} />
              <LogSheets dailyLogs={plan.daily_logs} />
            </>
          )}
        </div>
      </div>

      <footer className="footer">
        Built with Django + React · Routing by OSRM · Geocoding by Nominatim ·
        Maps © OpenStreetMap
      </footer>
    </div>
  );
}
