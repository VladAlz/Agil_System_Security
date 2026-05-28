import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { API_URL } from "@/config/api";

interface User {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
  facultad: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem("ssiu_token");
    const storedUser = localStorage.getItem("ssiu_user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: email, password })
      });

      if (response.ok) {
        const data = await response.json();
        const userData = data.usuario;
        const userToken = data.token;

        if (userData.rol !== "Administrador") {
          throw new Error("Acceso denegado: Solo los administradores pueden acceder a este panel.");
        }

        localStorage.setItem("ssiu_token", userToken);
        localStorage.setItem("ssiu_user", JSON.stringify(userData));

        setToken(userToken);
        setUser(userData);
        
        toast.success(`Bienvenido, ${userData.nombre}`);
        navigate("/");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.mensaje || "Credenciales incorrectas");
      }
    } catch (error: any) {
      toast.error("Error de inicio de sesión", {
        description: error.message || "No se pudo conectar con el servidor."
      });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("ssiu_token");
    localStorage.removeItem("ssiu_user");
    setToken(null);
    setUser(null);
    toast.info("Sesión cerrada");
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isAuthenticated: !!token, 
      login, 
      logout,
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
