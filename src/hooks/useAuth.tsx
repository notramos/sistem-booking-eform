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
  refreshUser: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  isAdmin: boolean;
  isItAdmin: boolean;
  isSekretariat: boolean;
  isUmat: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Sesi disimpan di cookie session HttpOnly (tak bisa dibaca/di-cek dari JS),
  // jadi satu-satunya cara tahu status login adalah benar-benar bertanya ke backend.
  const fetchUser = useCallback(async () => {
    try {
      const res = await authApi.getUser();
      setUser(res.data.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // fetchUser juga diekspos sebagai refreshUser() untuk dipanggil imperatif
    // di tempat lain (mis. profile/page.tsx) — pola fetch-on-mount ini disengaja.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setUser(res.data.data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const hasRole = useCallback(
    (role: string) => user?.roles?.some((r) => r.name === role) ?? false,
    [user],
  );

  const hasAnyRole = useCallback(
    (roles: string[]) => roles.some((role) => hasRole(role)),
    [hasRole],
  );

  const value = {
    user,
    loading,
    login,
    logout,
    refreshUser: fetchUser,
    hasRole,
    hasAnyRole,
    // P2, Pastor, dan IT Admin sederajat di tahap approval final — bedanya cuma
    // IT Admin yang bisa kelola user internal (lihat isItAdmin).
    isAdmin: hasAnyRole(["p2", "pastor", "it_admin"]),
    isItAdmin: hasRole("it_admin"),
    isSekretariat: hasRole("sekretariat"),
    isUmat: hasRole("umat"),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
