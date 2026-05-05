export default function EntityForm({ title, fields, value, onChange, onSubmit, onCancel, submitLabel = 'Lưu' }) {
  return (
    <div className="card form-card">
      <div className="section-title-row">
        <h3>{title}</h3>
        {onCancel && (
          <button className="button secondary" type="button" onClick={onCancel}>
            Đóng
          </button>
        )}
      </div>

      <form className="form-grid split-grid" onSubmit={onSubmit}>
        {fields.map((field) => (
          <label key={field.name} className={field.full ? 'span-2' : ''}>
            {field.label}

            {field.type === 'select' ? (
              <select
                value={value[field.name] ?? ''}
                onChange={(e) => onChange(field.name, e.target.value)}
                disabled={field.disabled}
                required={field.required}
              >
                <option value="">{field.placeholder || 'Chọn'}</option>
                {(field.options || []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea
                rows={field.rows || 3}
                value={value[field.name] ?? ''}
                onChange={(e) => onChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                disabled={field.disabled}
                readOnly={field.readOnly}
                required={field.required}
              />
            ) : (
              <input
                type={field.type || 'text'}
                value={value[field.name] ?? ''}
                onChange={(e) => onChange(field.name, e.target.value)}
                min={field.min}
                max={field.max}
                step={field.step}
                placeholder={field.placeholder}
                disabled={field.disabled}
                readOnly={field.readOnly}
                required={field.required}
              />
            )}
          </label>
        ))}

        <div className="action-row span-2">
          <button className="button" type="submit">
            {submitLabel}
          </button>

          {onCancel && (
            <button className="button secondary" type="button" onClick={onCancel}>
              Hủy
            </button>
          )}
        </div>
      </form>
    </div>
  );
}