import { fmtDate, STATUS_META } from "../utils";

// ---- Grid geometry (SVG user units) ----
const GRID_LEFT = 118;
const HOUR_W = 38;
const GRID_W = HOUR_W * 24;
const GRID_RIGHT = GRID_LEFT + GRID_W;
const ROW_H = 34;
const GRID_TOP = 40;
const GRID_BOTTOM = GRID_TOP + ROW_H * 4;
const TOTALS_W = 70;
const REMARKS_H = 96;
const VIEW_W = GRID_RIGHT + TOTALS_W + 8;
const VIEW_H = GRID_BOTTOM + REMARKS_H;

const ROW_LABELS = [
  "1. Off Duty",
  "2. Sleeper Berth",
  "3. Driving",
  "4. On Duty (not driving)",
];

const STATUS_ORDER = ["off_duty", "sleeper_berth", "driving", "on_duty"];

const X = (hour) => GRID_LEFT + hour * HOUR_W;
const rowCenterY = (row) => GRID_TOP + row * ROW_H + ROW_H / 2;

const cityOf = (loc) => (loc ? loc.split(",")[0].trim() : "");

const HOUR_LABELS = [
  "Mid", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11",
  "Noon", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "Mid",
];

export default function LogSheet({ day, index, total }) {
  const segments = day.segments || [];

  // Build the duty-status step line path.
  let path = "";
  segments.forEach((seg, i) => {
    const row = STATUS_META[seg.status]?.row ?? 0;
    const y = rowCenterY(row);
    const x1 = X(seg.start_hour);
    const x2 = X(seg.end_hour);
    if (i === 0) {
      path += `M ${x1} ${y} L ${x2} ${y}`;
    } else {
      path += ` L ${x1} ${y} L ${x2} ${y}`;
    }
  });

  // Duty-status changes → remark ticks + rotated city labels.
  const remarks = [];
  let prevRow = null;
  segments.forEach((seg) => {
    const row = STATUS_META[seg.status]?.row ?? 0;
    if (row !== prevRow) {
      const city = cityOf(seg.location);
      if (city) {
        remarks.push({ hour: seg.start_hour, city });
      }
      prevRow = row;
    }
  });

  return (
    <div className="logsheet">
      <div className="log-head">
        <div className="title">
          Driver's Daily Log
          <small>(24 hours) · One calendar day · U.S. DOT — FMCSA</small>
        </div>
        <div className="log-meta">
          <div className="item">
            <div className="k">Date</div>
            <div className="v">{day.date}</div>
          </div>
          <div className="item">
            <div className="k">Day</div>
            <div className="v">
              {index + 1} of {total}
            </div>
          </div>
          <div className="item">
            <div className="k">Total miles driving today</div>
            <div className="v">{Math.round(day.driving_miles)}</div>
          </div>
        </div>
      </div>

      <div style={{ fontSize: "0.72rem", color: "#64748b", marginBottom: 4 }}>
        {fmtDate(day.date)}
      </div>

      <svg
        className="log-grid-svg"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        aria-label={`ELD log grid for ${day.date}`}
      >
        {/* Hour labels (top) */}
        {HOUR_LABELS.map((lbl, h) => (
          <text
            key={`hl-${h}`}
            x={X(h)}
            y={GRID_TOP - 8}
            fontSize="9"
            textAnchor="middle"
            fill="#475569"
            fontWeight={lbl === "Mid" || lbl === "Noon" ? 700 : 400}
          >
            {lbl}
          </text>
        ))}

        {/* "Total Hours" header */}
        <text
          x={GRID_RIGHT + TOTALS_W / 2}
          y={GRID_TOP - 8}
          fontSize="9"
          textAnchor="middle"
          fill="#475569"
          fontWeight="700"
        >
          Total
        </text>

        {/* Quarter-hour minor gridlines */}
        {Array.from({ length: 24 * 4 + 1 }).map((_, i) => {
          const hour = i / 4;
          const isHour = i % 4 === 0;
          return (
            <line
              key={`v-${i}`}
              x1={X(hour)}
              y1={GRID_TOP}
              x2={X(hour)}
              y2={GRID_BOTTOM}
              stroke={isHour ? "#94a3b8" : "#e2e8f0"}
              strokeWidth={isHour ? 1 : 0.5}
            />
          );
        })}

        {/* Row horizontal lines + labels + shading */}
        {STATUS_ORDER.map((status, r) => {
          const yTop = GRID_TOP + r * ROW_H;
          return (
            <g key={`row-${r}`}>
              {r % 2 === 1 && (
                <rect
                  x={GRID_LEFT}
                  y={yTop}
                  width={GRID_W}
                  height={ROW_H}
                  fill="#f8fafc"
                />
              )}
              <line
                x1={GRID_LEFT}
                y1={yTop}
                x2={GRID_RIGHT}
                y2={yTop}
                stroke="#475569"
                strokeWidth="1"
              />
              <text
                x={GRID_LEFT - 8}
                y={yTop + ROW_H / 2 + 3}
                fontSize="9.5"
                textAnchor="end"
                fill="#0b1729"
                fontWeight="600"
              >
                {ROW_LABELS[r]}
              </text>
              {/* per-row total */}
              <text
                x={GRID_RIGHT + TOTALS_W / 2}
                y={yTop + ROW_H / 2 + 4}
                fontSize="12"
                textAnchor="middle"
                fill={STATUS_META[status].color}
                fontWeight="700"
              >
                {day.totals[status].toFixed(2)}
              </text>
            </g>
          );
        })}
        {/* bottom border of grid */}
        <line
          x1={GRID_LEFT}
          y1={GRID_BOTTOM}
          x2={GRID_RIGHT}
          y2={GRID_BOTTOM}
          stroke="#475569"
          strokeWidth="1"
        />
        {/* left + right borders */}
        <line x1={GRID_LEFT} y1={GRID_TOP} x2={GRID_LEFT} y2={GRID_BOTTOM} stroke="#475569" />
        <line x1={GRID_RIGHT} y1={GRID_TOP} x2={GRID_RIGHT} y2={GRID_BOTTOM} stroke="#475569" />

        {/* Grand total */}
        <text
          x={GRID_RIGHT + TOTALS_W / 2}
          y={GRID_BOTTOM + 16}
          fontSize="11"
          textAnchor="middle"
          fill="#0b1729"
          fontWeight="800"
        >
          = {day.total_hours.toFixed(0)}
        </text>

        {/* Duty status step line */}
        <path
          d={path}
          fill="none"
          stroke="#0b1729"
          strokeWidth="2.4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Remarks: vertical ticks + rotated city labels */}
        <text
          x={GRID_LEFT - 8}
          y={GRID_BOTTOM + 16}
          fontSize="9"
          textAnchor="end"
          fill="#475569"
          fontWeight="700"
        >
          Remarks
        </text>
        {remarks.map((rm, i) => (
          <g key={`rm-${i}`}>
            <line
              x1={X(rm.hour)}
              y1={GRID_BOTTOM}
              x2={X(rm.hour)}
              y2={GRID_BOTTOM + 10}
              stroke="#94a3b8"
              strokeWidth="0.8"
            />
            <text
              x={X(rm.hour)}
              y={GRID_BOTTOM + 14}
              fontSize="8.5"
              fill="#334155"
              transform={`rotate(55 ${X(rm.hour)} ${GRID_BOTTOM + 14})`}
            >
              {rm.city}
            </text>
          </g>
        ))}
      </svg>

      <div className="log-legend">
        {STATUS_ORDER.map((s) => (
          <span key={s}>
            <span
              className="sw"
              style={{ background: STATUS_META[s].color }}
            />
            {STATUS_META[s].label}
          </span>
        ))}
      </div>
    </div>
  );
}
