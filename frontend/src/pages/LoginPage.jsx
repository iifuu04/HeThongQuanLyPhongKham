import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { demoAccounts } from '../data/seedData';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: 'admin01', password: '123456' });
  const [error, setError] = useState('');

  function onSubmit(event) {
    event.preventDefault();
    try {
      login(form.username, form.password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="card login-card">
      <div className="login-head">
        <div>
          <div className="eyebrow dark">Đăng nhập</div>
          <h2>Truy cập hệ thống</h2>
          <p className="muted">Nhập thông tin tài khoản để tiếp tục.</p>
        </div>
        <div className="secure-chip">Bảo mật</div>
      </div>

      <form className="form-grid" onSubmit={onSubmit}>
        <label>Tên đăng nhập<input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label>
        <label>Mật khẩu<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        {error ? <div className="alert">{error}</div> : null}
        <button className="button" type="submit">Đăng nhập</button>
      </form>

      <div className="demo-box">
        <strong>Tài khoản mẫu</strong>
        <div className="demo-grid">
          {demoAccounts.map((item) => (
            <button key={item.username} className="demo-user" type="button" onClick={() => setForm({ username: item.username, password: item.password })}>
              <span>{item.label}</span>
              <small>{item.username}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
