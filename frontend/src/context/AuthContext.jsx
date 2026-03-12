import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Tenter de recharger l'utilisateur depuis le refresh token au démarrage
  useEffect(() => {
    const init = async () => {
      const stored = localStorage.getItem('accessToken');
      if (!stored) {
        // Tenter un refresh silencieux (cookie httpOnly)
        try {
          const res = await authApi.refresh();
          localStorage.setItem('accessToken', res.data.accessToken);
          setUser(res.data.user);
        } catch {
          // pas de session active
        }
      } else {
        try {
          const res = await authApi.me();
          setUser(res.data);
        } catch {
          // token invalide, tenter refresh
          try {
            const res = await authApi.refresh();
            localStorage.setItem('accessToken', res.data.accessToken);
            setUser(res.data.user);
          } catch {
            localStorage.removeItem('accessToken');
          }
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password });
    localStorage.setItem('accessToken', res.data.accessToken);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (data) => {
    const res = await authApi.register(data);
    localStorage.setItem('accessToken', res.data.accessToken);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch (_) {}
    localStorage.removeItem('accessToken');
    setUser(null);
  }, []);

  const updateUser = useCallback((data) => {
    setUser(prev => ({ ...prev, ...data }));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
