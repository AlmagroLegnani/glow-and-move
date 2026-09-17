import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);
const STORAGE_KEY = 'glowmove_token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async (currentToken) => {
    const t = currentToken ?? token;
    if (!t) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.me(t);
      setUser(me);
    } catch {
      setUser(null);
      setToken(null);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshMe(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persistToken(newToken) {
    setToken(newToken);
    localStorage.setItem(STORAGE_KEY, newToken);
  }

  async function login(email, password) {
    const data = await api.login({ email, password });
    persistToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(fields) {
    const data = await api.register(fields);
    persistToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function startTrial(fields) {
    const data = await api.startTrial(fields);
    persistToken(data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    if (token) api.admin.releaseLock(token).catch(() => {});
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, startTrial, logout, refreshMe: () => refreshMe(token) }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
