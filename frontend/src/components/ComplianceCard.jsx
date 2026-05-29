function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function Cross() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export default function ComplianceCard({ items }) {
  if (!items?.length) return null;
  const allOk = items.every((i) => i.ok);

  return (
    <div className="card">
      <div className="card-header">
        <h2>HOS Compliance</h2>
        <span className="sub">
          {allOk ? "All federal limits respected ✓" : "Review details"}
        </span>
      </div>
      <div className="card-body">
        <ul className="compliance-list">
          {items.map((it) => (
            <li key={it.label} className={it.ok ? "ok" : "bad"}>
              <span className="ck">{it.ok ? <Check /> : <Cross />}</span>
              <span className="cl">
                <span className="cl-label">{it.label}</span>
                <span className="cl-detail">{it.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
