import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, GuardUser } from '../services/authService';

type AuthContextType = {
  token: string | null;
  guard: GuardUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (correo: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateGuardStatus: (nuevoEstado: string) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [guard, setGuard] = useState<GuardUser | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!token && !!guard;

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const session = await authService.getSession();

      if (session) {
        setToken(session.token);
        setGuard(session.usuario);
      }
    } catch (error) {
      await authService.logout();
      setToken(null);
      setGuard(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (correo: string, password: string) => {
    const session = await authService.login(correo, password);
    setToken(session.token);
    setGuard(session.usuario);
  };

  const logout = async () => {
    await authService.logout();
    setToken(null);
    setGuard(null);
  };

  const updateGuardStatus = (nuevoEstado: string) => {
    setGuard((prev) => {
      if (!prev) return prev;

      const updatedGuard = {
        ...prev,
        estado: nuevoEstado,
      };

      return updatedGuard;
     });
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        guard,
        loading,
        isAuthenticated,
        login,
        logout,
        updateGuardStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return context;
}