// Decorative animated "driving" scene (sky, hills, road, moving truck).
export default function RoadScene() {
  return (
    <div className="road-scene" aria-hidden="true">
      <div className="cloud c1" />
      <div className="cloud c2" />
      <div className="cloud c3" />
      <div className="hills" />
      <div className="road">
        <div className="road-line" />
      </div>
      <div className="truck">
        <svg width="74" height="46" viewBox="0 0 78 48" fill="none">
          <rect x="2" y="8" width="44" height="26" rx="3" fill="#e2e8f0" stroke="#0b1729" strokeWidth="2" />
          <rect x="8" y="13" width="32" height="6" rx="1" fill="#cbd5e1" />
          <path d="M46 16h12l8 8v10H46z" fill="#f59e0b" stroke="#0b1729" strokeWidth="2" strokeLinejoin="round" />
          <path d="M58 18h6l4 6h-10z" fill="#bae6fd" stroke="#0b1729" strokeWidth="1.5" />
          <circle cx="16" cy="36" r="6" fill="#1e293b" stroke="#0b1729" strokeWidth="2" />
          <circle cx="16" cy="36" r="2" fill="#94a3b8" />
          <circle cx="56" cy="36" r="6" fill="#1e293b" stroke="#0b1729" strokeWidth="2" />
          <circle cx="56" cy="36" r="2" fill="#94a3b8" />
        </svg>
        <div className="speed-lines">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
