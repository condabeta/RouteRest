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

      <div className="container">
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
              {/* Route Map on top, full width */}
              <div className="card">
                <div className="card-header">
                  <h2>Route Map</h2>
                  <span className="sub">
                    OpenStreetMap · {Math.round(plan.summary.total_distance_miles)} mi
                  </span>
                </div>
                <p className="map-intro">
                  RouteRest plots your full route and marks every required stop —
                  fueling, 30-minute breaks, and 10-hour rests — so the drive stays
                  within federal Hours-of-Service limits.
                </p>
                <RouteMap plan={plan} />
              </div>

              {/* Trip Summary (left) + Itinerary & Stops (right) */}
              <div className="results-split">
                <TripSummary summary={plan.summary} />
                <StopsTimeline stops={plan.stops} />
              </div>

              {/* Daily Log Sheets full width */}
              <LogSheets dailyLogs={plan.daily_logs} />
            </>
          )}
        </div>
      </div>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="footer-logo">
              <TruckIcon />
            </div>
            <div className="footer-brand-text">
              <strong>RouteRest</strong>
              <span>Plan your drive. Stay road-legal. Get home safe.</span>
            </div>
          </div>

          <nav className="footer-cols">
            <div className="footer-col">
              <h4>What it does</h4>
              <ul>
                <li>Maps your route</li>
                <li>Schedules fuel &amp; rest stops</li>
                <li>Draws daily ELD logs</li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Hours of Service</h4>
              <ul>
                <li>11-hour driving limit</li>
                <li>14-hour on-duty window</li>
                <li>70-hour / 8-day cycle</li>
                <li>34-hour restart</li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>For drivers</h4>
              <ul>
                <li>
                  <a href="https://www.fmcsa.dot.gov/regulations/hours-of-service" target="_blank" rel="noreferrer">FMCSA HOS guide</a>
                </li>
                <li>Plan rested. Drive safe.</li>
                <li>Property carrier · U.S. interstate</li>
              </ul>
            </div>
          </nav>

          <div className="footer-phone" aria-hidden="true">
            <svg className="phone-gps" viewBox="0 0 92 150" xmlns="http://www.w3.org/2000/svg">
              <rect className="phone-body" x="3" y="2" width="86" height="146" rx="15" />
              <rect className="phone-screen" x="9" y="13" width="74" height="124" rx="9" />
              <rect className="notch" x="36" y="7" width="20" height="3" rx="1.5" />
              <g className="roads">
                <path d="M9 56 H83" />
                <path d="M9 100 H83" />
                <path d="M34 13 V137" />
                <path d="M62 13 V137" />
              </g>
              <path className="route" d="M26 120 V92 Q26 78 44 78 H58 Q73 78 71 50 L67 34" />
              <g className="dest">
                <path d="M67 24 c-5 0 -9 4 -9 9 c0 6 9 15 9 15 s9 -9 9 -15 c0 -5 -4 -9 -9 -9 z" />
                <circle cx="67" cy="33" r="3.2" />
              </g>
              <g className="gps">
                <circle className="pulse p1" cx="26" cy="120" r="17" />
                <circle className="pulse p2" cx="26" cy="120" r="11" />
                <path className="nav-arrow" d="M26 110 l8 19 l-8 -6 l-8 6 z" />
              </g>
              <g className="gps-badge">
                <rect x="15" y="19" width="34" height="13" rx="6.5" />
                <text x="32" y="28.5" textAnchor="middle">GPS ON</text>
              </g>
            </svg>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 RouteRest · Drive safe, stay legal</span>
          <span>Maps © OpenStreetMap contributors</span>
        </div>
      </footer>
    </div>
  );
}
