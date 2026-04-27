export default function StatCard({ title, value, note }) {
  return (
    <div className="card stat-card">
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
