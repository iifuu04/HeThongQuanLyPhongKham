import { createContext, useContext, useMemo, useState } from 'react';
import { useClinic } from './ClinicContext';

const AuthContext = createContext(null);
const AUTH_KEY = 'medsys_ui_auth';

function readSession() {
  const raw = localStorage.getItem(AUTH_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function AuthProvider({ children }) {
  const { db, recordLogin } = useClinic();
  const [session, setSession] = useState(readSession);

  const user = useMemo(() => {
    if (!session) return null;
    return db.profiles.find((item) => item.id === session.profileId) || null;
  }, [session, db.profiles]);

  function login(username, password) {
    const profile = db.profiles.find((item) => item.username === username && item.password === password);
    if (!profile) throw new Error('Sai tài khoản hoặc mật khẩu.');
    if (profile.status !== 'active') throw new Error('Tài khoản đang tạm khóa.');
    const next = { profileId: profile.id };
    setSession(next);
    localStorage.setItem(AUTH_KEY, JSON.stringify(next));
    recordLogin(profile.id);
  }

  function logout() {
    setSession(null);
    localStorage.removeItem(AUTH_KEY);
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
