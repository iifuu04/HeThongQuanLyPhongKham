export default function PageHeader({ title, subtitle, action, extra }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      <div className="page-actions">
        {extra}
        {action}
      </div>
    </div>
  );
}
