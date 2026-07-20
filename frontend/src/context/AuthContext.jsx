import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { decodeJwtPayload } from '../utils/jwt';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      const payload = decodeJwtPayload(token);
      setUser({ token, role: payload?.role || null });
    }
    setLoading(false);
  }, []);

  const login = (token) => {
    localStorage.setItem('access_token', token);
    const payload = decodeJwtPayload(token);
    setUser({ token, role: payload?.role || null });
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
