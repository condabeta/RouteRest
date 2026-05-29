import { useState } from "react";
import TripForm from "./components/TripForm";
import RouteMap from "./components/RouteMap";
import TripSummary from "./components/TripSummary";
import StopsTimeline from "./components/StopsTimeline";
import LogSheets from "./components/LogSheets";
import { planTrip } from "./api";

function TruckIcon({ stroke = "#0b1729", size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 17h4V5H2v12h3" />
      <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1" />
      <circle cx="7.5" cy="17.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  );
}

// Decorative animated "driving" band shown below the form.
function RoadBand() {
  return (
    <div className="road-band" aria-hidden="true">
      <div className="cloud c1" />
      <div className="cloud c2" />
      <div className="cloud c3" />
      <div className="hills" />
      <div className="road">
        <div className="road-line" />
      </div>
      <div className="truck">
        <svg width="78" height="48" viewBox="0 0 78 48" fill="none">
          {/* trailer */}
          <rect x="2" y="8" width="44" height="26" rx="3" fill="#e2e8f0" stroke="#0b1729" strokeWidth="2" />
          <rect x="8" y="13" width="32" height="6" rx="1" fill="#cbd5e1" />
          {/* cab */}
          <path d="M46 16h12l8 8v10H46z" fill="#f59e0b" stroke="#0b1729" strokeWidth="2" strokeLinejoin="round" />
          <path d="M58 18h6l4 6h-10z" fill="#bae6fd" stroke="#0b1729" strokeWidth="1.5" />
          {/* wheels */}
          <circle cx="16" cy="36" r="6" fill="#1e293b" stroke="#0b1729" strokeWidth="2" />
          <circle cx="16" cy="36" r="2" fill="#94a3b8" />
          <circle cx="56" cy="36" r="6" fill="#1e293b" stroke="#0b1729" strokeWidth="2" />
          <circle cx="56" cy="36" r="2" fill="#94a3b8" />
        </svg>
        <div className="speed-lines">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
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

      <div className="container">
        <TripForm onSubmit={handleSubmit} loading={loading} />

        <RoadBand />

        <div id="results-top">
          {error && <div className="error-box top-error">{error}</div>}

          {!plan && !error && (
            <div className="card">
              <div className="placeholder">
                <div className="big-icon">
                  <TruckIcon stroke="#94a3b8" size={36} />
                </div>
                <h3>Plan your first trip</h3>
                <p>
                  Enter your route and current cycle hours above, then we'll map
                  the drive with every required rest stop and draw your daily
                  ELD log sheets.
                </p>
              </div>
            </div>
          )}

          {plan && (
            <div className="results">
              {/* Row 1 — Trip Summary (left) + Route Map (right), equal height */}
              <div className="grid-pair top">
                <TripSummary summary={plan.summary} />
                <div className="card map-card">
                  <div className="card-header">
                    <h2>Route Map</h2>
                    <span className="sub">
                      {Math.round(plan.summary.total_distance_miles)} mi · OpenStreetMap
                    </span>
                  </div>
                  <RouteMap plan={plan} />
                </div>
              </div>

              {/* Row 2 — Itinerary (left) + Daily Log Sheets (right) */}
              <div className="grid-pair bottom">
                <StopsTimeline stops={plan.stops} />
                <LogSheets dailyLogs={plan.daily_logs} />
              </div>
            </div>
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
