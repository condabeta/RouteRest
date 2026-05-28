export function fmtTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function fmtDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function fmtDate(iso) {
  // iso may be a date-only string "2026-05-28"
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function fmtHours(h) {
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export const STATUS_META = {
  off_duty: { label: "Off Duty", color: "#64748b", row: 0 },
  sleeper_berth: { label: "Sleeper Berth", color: "#7c3aed", row: 1 },
  driving: { label: "Driving", color: "#2563eb", row: 2 },
  on_duty: { label: "On Duty (Not Driving)", color: "#f59e0b", row: 3 },
};

export const STOP_META = {
  start: { color: "#0b1729", icon: "▶" },
  pickup: { color: "#16a34a", icon: "⬆" },
  dropoff: { color: "#dc2626", icon: "⬇" },
  fuel: { color: "#f59e0b", icon: "⛽" },
  rest: { color: "#7c3aed", icon: "🛏" },
  break: { color: "#0ea5e9", icon: "☕" },
};
