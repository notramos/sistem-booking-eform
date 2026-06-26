"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { authApi } from "@/lib/api/auth";
import type { User } from "@/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  isAdmin: boolean;
  isSekretariat: boolean;
  isJemaat: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      const res = await authApi.getUser();
      setUser(res.data.data);
    } catch {
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const setTokenCookie = (token: string) => {
    document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax`;
  };

  const removeTokenCookie = () => {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  };

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const { user: userData, token } = res.data.data;
    localStorage.setItem("token", token);
    setTokenCookie(token);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      localStorage.removeItem("token");
      removeTokenCookie();
      setUser(null);
    }
  }, []);

  const hasRole = useCallback(
    (role: string) => {
      return user?.roles?.some((r) => r.name === role) ?? false;
    },
    [user],
  );

  const hasAnyRole = useCallback(
    (roles: string[]) => {
      return roles.some((role) => hasRole(role));
    },
    [hasRole],
  );

  const value = {
    user,
    loading,
    login,
    logout,
    hasRole,
    hasAnyRole,
    isAdmin: hasRole("admin"),
    isSekretariat: hasRole("sekretariat"),
    isJemaat: hasRole("jemaat"),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
