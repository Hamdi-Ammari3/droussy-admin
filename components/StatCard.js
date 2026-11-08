// Teacher-dashboard stat card (enseignantPage.css): tone = "" | mint | sun | sky | coral
export default function StatCard({ label, value, hint, tone = "" }) {
  return (
    <div className={`ens-stat-card ${tone ? `ens-stat-card-${tone}` : ""}`}>
      <p className="ens-stat-label">{label}</p>
      <p className="ens-stat-value">{value}</p>
      {hint ? <p className="ens-stat-hint">{hint}</p> : null}
    </div>
  );
}
