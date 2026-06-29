export default function StatCard({ icon, colorClass, value, label }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${colorClass}`}><i className={`ti ${icon}`} /></div>
      <div>
        <div className="stat-val">{value}</div>
        <div className="stat-lbl">{label}</div>
      </div>
    </div>
  );
}
