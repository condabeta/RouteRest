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
            <strong>Cycle used</strong> = on-duty hours already logged over your
            past 8 days. The 70-hour limit counts from here — enter{" "}
            <strong>0</strong> if you're fresh off a 34-hour restart.
          </p>

          <button className="btn btn-go" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" />
                Planning…
              </>
            ) : (
              <>
                <svg className="btn-truck" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 17h4V5H2v12h3" />
                  <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1" />
                  <circle cx="7.5" cy="17.5" r="2.5" />
                  <circle cx="17.5" cy="17.5" r="2.5" />
                </svg>
                Plan trip
              </>
            )}
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
