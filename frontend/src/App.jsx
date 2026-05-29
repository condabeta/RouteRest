import { useState } from "react";
import TripForm from "./components/TripForm";
import RouteMap from "./components/RouteMap";
import TripSummary from "./components/TripSummary";
import StopsTimeline from "./components/StopsTimeline";
import LogSheets from "./components/LogSheets";
import LandingInfo from "./components/LandingInfo";
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

        <div id="results-top">
          {error && <div className="error-box top-error">{error}</div>}

          {!plan && !error && <LandingInfo />}

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
