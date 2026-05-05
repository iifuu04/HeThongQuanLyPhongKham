import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(form.username, form.password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.message || 'Đăng nhập thất bại.');
      }
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  }

  const demoAccounts = [
    { username: 'admin01', password: '123456', label: 'Quản trị viên' },
    { username: 'reception01', password: '123456', label: 'Lễ tân' },
    { username: 'doctor01', password: '123456', label: 'Bác sĩ' },
    { username: 'patient01', password: '123456', label: 'Bệnh nhân' },
  ];

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
        <label>
          Tên đăng nhập
          <input
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="Nhập tên đăng nhập"
            required
          />
        </label>
        <label>
          Mật khẩu
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Nhập mật khẩu"
            required
          />
        </label>
        {error ? <div className="alert">{error}</div> : null}
        <button className="button" type="submit" disabled={loading}>
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
    </div>
  );
}
