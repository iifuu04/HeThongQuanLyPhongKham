import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);
const AUTH_KEY = 'medsys_auth';

function readSession() {
  const raw = localStorage.getItem(AUTH_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function validateSession() {
      if (!session) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.getProfile();
        if (response.success && response.data) {
          const updatedUser = {
            ...session.user,
            ...response.data,
          };
          const updatedSession = { ...session, user: updatedUser };
          setSession(updatedSession);
          localStorage.setItem(AUTH_KEY, JSON.stringify(updatedSession));
        } else {
          logout();
        }
      } catch (error) {
        console.error('Session validation failed:', error);
      } finally {
        setLoading(false);
      }
    }

    validateSession();
  }, []);

  const user = useMemo(() => {
    return session?.user || null;
  }, [session]);

  async function login(username, password) {
    try {
      const response = await api.login(username, password);
      if (response.success && response.data) {
        const { token, user: userData } = response.data;
        const sessionData = { token, user: userData };
        setSession(sessionData);
        localStorage.setItem(AUTH_KEY, JSON.stringify(sessionData));
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Login failed' };
      }
    } catch (error) {
      return { success: false, message: error.message || 'Login failed' };
    }
  }

  function logout() {
    setSession(null);
    localStorage.removeItem(AUTH_KEY);
    api.clearAuth();
  }

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!session,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
