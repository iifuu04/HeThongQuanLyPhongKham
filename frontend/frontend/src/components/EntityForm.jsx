export default function EntityForm({ title, fields, value, onChange, onSubmit, onCancel, submitLabel = 'Lưu' }) {
  return (
    <div className="card form-card">
      <div className="section-title-row">
        <h3>{title}</h3>
        {onCancel && <button className="button secondary" type="button" onClick={onCancel}>Đóng</button>}
      </div>
      <form className="form-grid split-grid" onSubmit={onSubmit}>
        {fields.map((field) => (
          <label key={field.name} className={field.full ? 'span-2' : ''}>
            {field.label}
            {field.type === 'select' ? (
              <select value={value[field.name] ?? ''} onChange={(e) => onChange(field.name, e.target.value)}>
                <option value="">Chọn</option>
                {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea rows="3" value={value[field.name] ?? ''} onChange={(e) => onChange(field.name, e.target.value)} />
            ) : (
              <input type={field.type || 'text'} value={value[field.name] ?? ''} onChange={(e) => onChange(field.name, e.target.value)} />
            )}
          </label>
        ))}
        <div className="action-row span-2">
          <button className="button" type="submit">{submitLabel}</button>
          {onCancel && <button className="button secondary" type="button" onClick={onCancel}>Hủy</button>}
        </div>
      </form>
    </div>
  );
}
