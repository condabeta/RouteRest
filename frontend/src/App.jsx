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

      {error && (
        <div className="alert-toast" role="alert">
          <svg className="alert-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span className="alert-text">{error}</span>
          <button
            type="button"
            className="alert-close"
            onClick={() => setError("")}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <div className="container">
        <TripForm onSubmit={handleSubmit} loading={loading} />

        <div className="results" id="results-top">
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
              {/* Brief site intro above the map */}
              <div className="site-intro">
                <h2>Your trip, mapped and logged.</h2>
                <p>
                  RouteRest turns your route and remaining cycle hours into a
                  complete, HOS-compliant plan — every fuel stop, 30-minute
                  break, and 10-hour rest, plus ready-to-submit daily ELD logs.
                </p>
              </div>

              {/* Route Map on top, full width */}
              <div className="card">
                <div className="card-header">
                  <h2>Route Map</h2>
                  <span className="sub">
                    OpenStreetMap · {Math.round(plan.summary.total_distance_miles)} mi
                  </span>
                </div>
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
            <svg className="phone-mock" viewBox="0 0 120 244" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="pframe" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#4b515d" />
                  <stop offset="0.5" stopColor="#23272f" />
                  <stop offset="1" stopColor="#30353f" />
                </linearGradient>
                <linearGradient id="pgloss" x1="0" y1="0" x2="0.7" y2="1">
                  <stop offset="0" stopColor="#ffffff" stopOpacity="0.22" />
                  <stop offset="0.35" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
                <clipPath id="pscreen">
                  <rect x="8" y="9" width="104" height="226" rx="19" />
                </clipPath>
              </defs>

              {/* body + side buttons */}
              <rect x="2" y="2" width="116" height="240" rx="26" fill="url(#pframe)" stroke="#0e1116" strokeWidth="1.5" />
              <rect x="0.5" y="58" width="2" height="14" rx="1" fill="#15181e" />
              <rect x="0.5" y="80" width="2" height="22" rx="1" fill="#15181e" />
              <rect x="117.5" y="74" width="2" height="30" rx="1" fill="#15181e" />

              <g clipPath="url(#pscreen)">
                {/* map base */}
                <rect x="8" y="9" width="104" height="226" fill="#e8edf0" />
                <path d="M8 168 Q44 158 70 176 T112 168 V210 H8 Z" fill="#bfe1ef" />
                <rect x="74" y="56" width="38" height="40" fill="#d2ebd2" />
                {/* roads (casing + fill) */}
                <g strokeLinecap="round">
                  <path d="M0 96 H120" stroke="#cdd6dd" strokeWidth="9" />
                  <path d="M0 96 H120" stroke="#ffffff" strokeWidth="6" />
                  <path d="M30 9 V235" stroke="#cdd6dd" strokeWidth="9" />
                  <path d="M30 9 V235" stroke="#ffffff" strokeWidth="6" />
                  <path d="M88 9 V235" stroke="#cdd6dd" strokeWidth="7" />
                  <path d="M88 9 V235" stroke="#ffffff" strokeWidth="4.5" />
                  <path d="M0 132 H120" stroke="#f3cd6a" strokeWidth="9" />
                </g>
                {/* route with casing */}
                <path d="M40 178 V140 Q40 120 64 120 H86 Q100 120 100 90 V62" fill="none" stroke="#1a56c4" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M40 178 V140 Q40 120 64 120 H86 Q100 120 100 90 V62" fill="none" stroke="#2e7dff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                {/* destination pin */}
                <path d="M100 48 c-6 0 -10.5 4.6 -10.5 10.5 c0 7.3 10.5 16.5 10.5 16.5 s10.5 -9.2 10.5 -16.5 c0 -5.9 -4.5 -10.5 -10.5 -10.5 z" fill="#ea4335" stroke="#fff" strokeWidth="1.5" />
                <circle cx="100" cy="58.5" r="3.6" fill="#fff" />
                {/* GPS location puck */}
                <circle className="puck-pulse" cx="40" cy="178" r="15" fill="#2e7dff" opacity="0.18" />
                <circle cx="40" cy="178" r="7" fill="#2e7dff" stroke="#fff" strokeWidth="2.5" />

                {/* status bar */}
                <text x="17" y="22" fontSize="8" fontWeight="700" fill="#1f2937" fontFamily="Inter">9:41</text>
                <rect x="95" y="16" width="11" height="7" rx="1.6" fill="none" stroke="#1f2937" strokeWidth="1" />
                <rect x="96.5" y="17.5" width="7.5" height="4" rx="0.6" fill="#1f2937" />

                {/* nav banner */}
                <rect x="14" y="28" width="92" height="22" rx="6" fill="#137a3a" />
                <path d="M23 39 l6 -6 v4 h6 v4 h-6 v4 z" fill="#fff" />
                <text x="40" y="38" fontSize="8.5" fontWeight="800" fill="#fff" fontFamily="Inter">I-10 E</text>
                <text x="40" y="47" fontSize="6.5" fill="#cdeed8" fontFamily="Inter">2.3 mi</text>

                {/* ETA card */}
                <rect x="8" y="205" width="104" height="30" fill="#ffffff" />
                <text x="16" y="220" fontSize="9.5" fontWeight="800" fill="#137333" fontFamily="Inter">14 min</text>
                <text x="16" y="230" fontSize="6.5" fill="#5f6368" fontFamily="Inter">9.1 mi · 2:45 PM</text>
                <circle cx="100" cy="220" r="9.5" fill="#1a73e8" />
                <path d="M97 215.5 l6 4.5 l-6 4.5 z" fill="#fff" />
              </g>

              {/* dynamic island + screen gloss */}
              <rect x="44" y="13" width="32" height="9" rx="4.5" fill="#0a0c10" />
              <rect x="8" y="9" width="104" height="226" rx="19" fill="url(#pgloss)" />
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
