import { useState } from "react";

const EXAMPLES = [
  {
    label: "LA → Phoenix → Dallas",
    current: "Los Angeles, CA",
    pickup: "Phoenix, AZ",
    dropoff: "Dallas, TX",
    cycle: 8,
  },
  {
    label: "Chicago → Indy → Atlanta",
    current: "Chicago, IL",
    pickup: "Indianapolis, IN",
    dropoff: "Atlanta, GA",
    cycle: 20,
  },
  {
    label: "Seattle → Portland → Denver",
    current: "Seattle, WA",
    pickup: "Portland, OR",
    dropoff: "Denver, CO",
    cycle: 45,
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

  const applyExample = (ex) => {
    setForm({
      current_location: ex.current,
      pickup_location: ex.pickup,
      dropoff_location: ex.dropoff,
      current_cycle_used: String(ex.cycle),
    });
    setError("");
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
    <form className="card form" onSubmit={submit}>
      <div className="sticky">
        <div className="card-header">
          <h2>Plan a Trip</h2>
          <span className="sub">Property carrier · 70hr/8day</span>
        </div>
        <div className="card-body">
          {error && <div className="error-box">{error}</div>}

          <div className="field">
            <label>Current location</label>
            <div className="input-wrap">
              <span className="pin current" />
              <input
                value={form.current_location}
                onChange={update("current_location")}
                placeholder="e.g. Los Angeles, CA"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="field">
            <label>Pickup location</label>
            <div className="input-wrap">
              <span className="pin pickup" />
              <input
                value={form.pickup_location}
                onChange={update("pickup_location")}
                placeholder="e.g. Phoenix, AZ"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="field">
            <label>Drop-off location</label>
            <div className="input-wrap">
              <span className="pin dropoff" />
              <input
                value={form.dropoff_location}
                onChange={update("dropoff_location")}
                placeholder="e.g. Dallas, TX"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="field">
            <label>
              Current cycle used{" "}
              <span className="hint">(hrs, 0–70)</span>
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
                Planning route…
              </>
            ) : (
              "Generate route & logs"
            )}
          </button>

          <div style={{ marginTop: 16 }}>
            <div className="field" style={{ marginBottom: 6 }}>
              <label style={{ marginBottom: 4 }}>Try an example</label>
            </div>
            <div className="example-chips">
              {EXAMPLES.map((ex) => (
                <button
                  type="button"
                  key={ex.label}
                  className="chip"
                  onClick={() => applyExample(ex)}
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
