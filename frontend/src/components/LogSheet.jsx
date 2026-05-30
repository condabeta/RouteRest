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

const fmt = (n) =>
  n == null ? "" : (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, "");

export default function LogSheet({ day, index, total, meta = {} }) {
  const segments = day.segments || [];
  const recap = day.recap || {};

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

  // Split the ISO date into the form's month / day / year boxes.
  const [yyyy = "", mm = "", dd = ""] = (day.date || "").split("-");
  const miles = Math.round(day.driving_miles);

  return (
    <div className="logsheet dl">
      {/* ---- Title row ---- */}
      <div className="dl-titlerow">
        <div className="dl-title">
          Driver's Daily Log <span>(24 hours)</span>
        </div>
        <div className="dl-date">
          <div className="dl-date-vals">
            <span>{mm}</span>/<span>{dd}</span>/<span>{yyyy}</span>
          </div>
          <div className="dl-date-lbls">
            <span>(month)</span><span>(day)</span><span>(year)</span>
          </div>
        </div>
        <div className="dl-original">
          <div>Original — File at home terminal.</div>
          <div>Duplicate — Driver retains in his/her possession for 8 days.</div>
          <div className="dl-day-of">
            Day {index + 1} of {total} · {fmtDate(day.date)}
          </div>
        </div>
      </div>

      {/* ---- From / To ---- */}
      <div className="dl-fromto">
        <div className="dl-line">
          <span className="lbl">From:</span>
          <span className="val">{meta.from || "—"}</span>
        </div>
        <div className="dl-line">
          <span className="lbl">To:</span>
          <span className="val">{meta.to || "—"}</span>
        </div>
      </div>

      {/* ---- Mileage + carrier block ---- */}
      <div className="dl-block">
        <div className="dl-block-left">
          <div className="dl-boxes">
            <div className="dl-box">
              <div className="bv">{miles}</div>
              <div className="bl">Total Miles Driving Today</div>
            </div>
            <div className="dl-box">
              <div className="bv">{miles}</div>
              <div className="bl">Total Mileage Today</div>
            </div>
          </div>
          <div className="dl-box wide">
            <div className="bv">
              {meta.tractor || "—"} / {meta.trailer || "—"}
            </div>
            <div className="bl">
              Truck/Tractor and Trailer Numbers or License Plate(s)/State
              (show each unit)
            </div>
          </div>
        </div>
        <div className="dl-block-right">
          <div className="dl-named">
            <div className="nv">{meta.carrier || "—"}</div>
            <div className="nl">Name of Carrier or Carriers</div>
          </div>
          <div className="dl-named">
            <div className="nv">{meta.office || "—"}</div>
            <div className="nl">Main Office Address</div>
          </div>
          <div className="dl-named">
            <div className="nv">{meta.homeTerminal || meta.office || "—"}</div>
            <div className="nl">Home Terminal Address</div>
          </div>
        </div>
      </div>

      {/* ---- Duty-status grid ---- */}
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
            fill="#111"
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
          fill="#111"
          fontWeight="700"
        >
          Total Hours
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
              stroke={isHour ? "#222" : "#9aa3ad"}
              strokeWidth={isHour ? 1 : 0.5}
            />
          );
        })}

        {/* Row horizontal lines + labels */}
        {STATUS_ORDER.map((status, r) => {
          const yTop = GRID_TOP + r * ROW_H;
          return (
            <g key={`row-${r}`}>
              <line
                x1={GRID_LEFT}
                y1={yTop}
                x2={GRID_RIGHT}
                y2={yTop}
                stroke="#222"
                strokeWidth="1"
              />
              <text
                x={GRID_LEFT - 8}
                y={yTop + ROW_H / 2 + 3}
                fontSize="9.5"
                textAnchor="end"
                fill="#111"
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
                fill="#111"
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
          stroke="#222"
          strokeWidth="1"
        />
        {/* left + right borders */}
        <line x1={GRID_LEFT} y1={GRID_TOP} x2={GRID_LEFT} y2={GRID_BOTTOM} stroke="#222" />
        <line x1={GRID_RIGHT} y1={GRID_TOP} x2={GRID_RIGHT} y2={GRID_BOTTOM} stroke="#222" />

        {/* Grand total */}
        <text
          x={GRID_RIGHT + TOTALS_W / 2}
          y={GRID_BOTTOM + 16}
          fontSize="11"
          textAnchor="middle"
          fill="#111"
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
          fill="#111"
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
              stroke="#555"
              strokeWidth="0.8"
            />
            <text
              x={X(rm.hour)}
              y={GRID_BOTTOM + 14}
              fontSize="8.5"
              fill="#222"
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

      {/* ---- Shipping documents + instruction ---- */}
      <div className="dl-ship">
        <div className="dl-ship-title">Shipping Documents:</div>
        <div className="dl-line">
          <span className="lbl">DVL or Manifest No.:</span>
          <span className="val">{meta.proNo || "—"}</span>
        </div>
        <div className="dl-line">
          <span className="lbl">Shipper &amp; Commodity:</span>
          <span className="val">
            {meta.shipper || "—"} · {meta.commodity || "—"}
          </span>
        </div>
        <div className="dl-instr">
          Enter name of place you reported and where released from work and when
          and where each change of duty occurred. Use time standard of home
          terminal.
        </div>
      </div>

      {/* ---- Recap (end-of-day) ---- */}
      <div className="dl-recap">
        <table>
          <thead>
            <tr>
              <th className="rh">Recap: Complete at end of day</th>
              <th>70 Hour / 8 Day Drivers</th>
              <th>60 Hour / 7 Day Drivers</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="rh">
                On-duty hours today
                <small>Total of lines 3 &amp; 4</small>
                <span className="rv">{fmt(recap.on_duty_today)}</span>
              </td>
              <td>
                <span className="ab">A.</span> On duty last 7 days incl. today
                <span className="rv">{fmt(recap.cycle_total)}</span>
              </td>
              <td>
                <span className="ab">A.</span> On duty last 8 days incl. today
                <span className="rv">—</span>
              </td>
            </tr>
            <tr>
              <td className="rh muted">
                Uses the 70-hour / 8-day cycle (property carrier).
              </td>
              <td>
                <span className="ab">B.</span> Available tomorrow (70 − A)
                <span className="rv">{fmt(recap.available_tomorrow)}</span>
              </td>
              <td>
                <span className="ab">B.</span> Available tomorrow (60 − A)
                <span className="rv">—</span>
              </td>
            </tr>
            <tr>
              <td className="rh muted">
                * After 34 consecutive hours off duty you have the full
                70 hours available.
              </td>
              <td>
                <span className="ab">C.</span> On duty last 5 days incl. today
                <span className="rv">—</span>
              </td>
              <td>
                <span className="ab">C.</span> On duty last 7 days incl. today
                <span className="rv">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ---- Driver certification ---- */}
      <div className="dl-sign">
        <span className="sigline">{meta.driver || ""}</span>
        <span className="lbl">
          Driver's signature — certifies these entries are true and correct
        </span>
      </div>
    </div>
  );
}
