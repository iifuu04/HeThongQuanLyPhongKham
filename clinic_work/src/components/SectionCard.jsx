export default function SectionCard({ title, subtitle, children, action }) {
  return (
    <div className="card section-card">
      <div className="section-title-row">
        <div>
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
