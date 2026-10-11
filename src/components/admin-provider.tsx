"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, tokenStore, type User } from "@/lib/api";

interface AdminState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AdminContext = createContext<AdminState | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!tokenStore.access) {
      setLoading(false);
      return;
    }
    api<{ user: User }>("/api/auth/me")
      .then((r) => {
        if (r.user.role !== "admin") {
          tokenStore.clear();
          setUser(null);
        } else {
          setUser(r.user);
        }
      })
      .catch(() => {
        tokenStore.clear();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const r = await api<{ user: User; accessToken: string; refreshToken: string }>("/api/auth/login", {
      method: "POST",
      auth: false,
      body: { email, password },
    });
    if (r.user.role !== "admin") throw new Error("This account is not an admin.");
    tokenStore.set(r);
    setUser(r.user);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = tokenStore.refresh;
    if (refreshToken) {
      try {
        await api("/api/auth/logout", { method: "POST", auth: false, body: { refreshToken } });
      } catch {
        /* ignore */
      }
    }
    tokenStore.clear();
    setUser(null);
    router.push("/login");
  }, [router]);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminState {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside AdminProvider");
  return ctx;
}

/** Gate: redirects to /login when missing, shows "Admin only" otherwise. */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAdmin();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);
  if (loading) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  if (!user) return null;
  return <>{children}</>;
}
