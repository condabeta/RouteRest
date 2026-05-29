import { useState } from "react";
import LocationInput from "./LocationInput";

const EXAMPLES = [
  {
    label: "LA → Phoenix → Dallas",
    current_location: "Los Angeles, California",
    pickup_location: "Phoenix, Arizona",
    dropoff_location: "Dallas, Texas",
    current_cycle_used: "8",
  },
  {
    label: "Chicago → Indy → Atlanta",
    current_location: "Chicago, Illinois",
    pickup_location: "Indianapolis, Indiana",
    dropoff_location: "Atlanta, Georgia",
    current_cycle_used: "20",
  },
  {
    label: "Seattle → Portland → Denver",
    current_location: "Seattle, Washington",
    pickup_location: "Portland, Oregon",
    dropoff_location: "Denver, Colorado",
    current_cycle_used: "45",
  },
];

export default function TripForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    current_location: "",
    pickup_location: "",
    dropoff_location: "",
    current_cycle_used: "",
  });
  const [error, setError] = useState("");

  const update = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const setLoc = (key) => (val) =>
    setForm((f) => ({ ...f, [key]: val }));

  const applyExample = (ex) => {
    setError("");
    setForm({
      current_location: ex.current_location,
      pickup_location: ex.pickup_location,
      dropoff_location: ex.dropoff_location,
      current_cycle_used: ex.current_cycle_used,
    });
  };

  const submit = (e) => {
    e.preventDefault();
    setError("");
    if (
      !form.current_location.trim() ||
      !form.pickup_location.trim() ||
      !form.dropoff_location.trim()
    ) {
      setError("Please fill in all three locations.");
      return;
    }
    const cycle = parseFloat(form.current_cycle_used);
    if (Number.isNaN(cycle) || cycle < 0 || cycle > 70) {
      setError("Current cycle used must be a number between 0 and 70.");
      return;
    }
    onSubmit({ ...form, current_cycle_used: cycle });
  };

  return (
    <form className="card form-hero" onSubmit={submit}>
      <div className="hero-slideshow" aria-hidden="true">
        <div className="slide s1" />
        <div className="slide s2" />
        <div className="slide s3" />
        <div className="slide s4" />
        <div className="slide s5" />
        <div className="slide s6" />
        <div className="slide s7" />
        <div className="hero-scrim" />
      </div>

      <div className="form-hero-content">
        <div className="hero-intro">
          <span className="hero-kicker">Drive safe · stay legal</span>
          <h2 className="hero-title">
            Every hour of rest brings you <span className="hl">home safe.</span>
          </h2>
          <p className="hero-message">
            Hours-of-Service limits aren't red tape — they keep you, and
            everyone sharing the road, safe. Take your breaks, log them
            honestly, and never push past your hours. Plan the smart way, and
            let RouteRest handle the rest.
          </p>
        </div>

        <div className="hero-left">
          {/* <div className="form-hero-head">
          <h2>Plan a Trip</h2>
          <span className="hero-sub">
            Property carrier · 70hr / 8day · U.S. interstate
          </span>
        </div> */}

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

          <div className="hero-grid">
            <LocationInput
              label="Current location"
              pinClass="current"
              value={form.current_location}
              onChange={setLoc("current_location")}
              placeholder="Start typing a U.S. city…"
            />
            <LocationInput
              label="Pickup location"
              pinClass="pickup"
              value={form.pickup_location}
              onChange={setLoc("pickup_location")}
              placeholder="Start typing a U.S. city…"
            />
            <LocationInput
              label="Drop-off location"
              pinClass="dropoff"
              value={form.dropoff_location}
              onChange={setLoc("dropoff_location")}
              placeholder="Start typing a U.S. city…"
            />

            <div className="field">
              <label>
                Cycle used <span className="hint">(hrs)</span>
              </label>
              <input
                className="no-pin"
                type="number"
                min="0"
                max="70"
                step="0.5"
                value={form.current_cycle_used}
                onChange={update("current_cycle_used")}
                placeholder="e.g. 12"
              />
            </div>
          </div>
          
          <p className="field-help">
            Cycle = on-duty hours used in your last 8 days (0–70).
          </p>

          <button className="btn btn-go" type="submit" disabled={loading}>
            <span className="btn-label">
              {loading ? (
                <>
                  <span className="spinner" />
                  Planning…
                </>
              ) : (
                <>
                  <svg className="car-front" viewBox="0 0 40 36" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path className="body" d="M8 31 V17 C8 11 12 8 20 8 C28 8 32 11 32 17 V31" />
                    <path className="windshield" d="M13.5 14.5 C15 11.5 17 10.5 20 10.5 C23 10.5 25 11.5 26.5 14.5" />
                    <line className="bumper" x1="5" y1="31" x2="35" y2="31" />
                    <rect className="hl hl-l" x="10.5" y="18" width="5.5" height="3.2" rx="1.3" />
                    <rect className="hl hl-r" x="24" y="18" width="5.5" height="3.2" rx="1.3" />
                    <rect className="grille" x="16.5" y="23.5" width="7" height="3.6" rx="1" />
                    <line className="tire" x1="12" y1="31" x2="12" y2="34" />
                    <line className="tire" x1="28" y1="31" x2="28" y2="34" />
                  </svg>
                  <span className="btn-text">Plan trip</span>
                </>
              )}
            </span>
          </button>

          <div className="hero-examples">
            <span className="ex-label">Try an example:</span>
            {EXAMPLES.map((ex) => (
              <button
                type="button"
                key={ex.label}
                className="hero-chip"
                onClick={() => applyExample(ex)}
                disabled={loading}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </form>
  );
}
