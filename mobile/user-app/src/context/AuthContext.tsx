import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { authService } from '../services/authService';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginDev: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    (async () => {
      // HU-10 / Security: Se deshabilita el auto-login para obligar siempre a pasar por la pantalla de login por seguridad.
      if (mounted.current) setIsLoading(false);
    })();
    return () => { mounted.current = false; };
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authService.login({ email, password });
    setUser(data.user);
    setToken(data.accessToken);
  };

  const loginDev = () => {
    setUser({ id: 'dev-001', name: 'Vladimir (Dev)', email: 'dev@ssiu.test', role: 'Student', faculty: 'FISEI' });
    setToken('dev-token');
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, loginDev, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
