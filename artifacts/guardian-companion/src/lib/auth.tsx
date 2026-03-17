import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "./api";

interface User {
  id: number;
  phone: string;
  name?: string;
  profileCompleted: boolean;
  issues: string[];
  preferences?: any;
  familyToken?: string;
  homeLat?: number;
  homeLng?: number;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("guardian_token");
    if (savedToken) {
      setToken(savedToken);
      api.users.me()
        .then(u => setUser(u))
        .catch(() => {
          localStorage.removeItem("guardian_token");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Apply dark mode from localStorage
  useEffect(() => {
    const theme = localStorage.getItem("guardian_theme");
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const login = (t: string, u: User) => {
    localStorage.setItem("guardian_token", t);
    setToken(t);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem("guardian_token");
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const u = await api.users.me();
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
