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
      <div className="form-hero-content">
        <div className="form-hero-head">
          <h2>Plan a Trip</h2>
          <span className="hero-sub">
            Property carrier · 70hr / 8day · U.S. interstate
          </span>
        </div>

        {error && <div className="error-box">{error}</div>}

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

          <button className="btn" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" />
                Planning…
              </>
            ) : (
              "Generate route & logs"
            )}
          </button>
        </div>

        <p className="field-help">
          <strong>Cycle used</strong> = on-duty hours already logged over your
          past 8 days. The 70-hour limit counts from here — enter{" "}
          <strong>0</strong> if you're fresh off a 34-hour restart.
        </p>

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
    </form>
  );
}
