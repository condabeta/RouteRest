// Base URL of the Django API. Configure via VITE_API_URL for production.
const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

export async function planTrip(payload) {
  const res = await fetch(`${API_BASE}/api/plan/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      data.error ||
      (data.current_cycle_used && data.current_cycle_used[0]) ||
      "Something went wrong while planning the trip.";
    throw new Error(msg);
  }
  return data;
}

export { API_BASE };
