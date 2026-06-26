"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiFetch, ApiError, AUTH_UNAUTHORIZED_EVENT } from "@/lib/api";

interface User {
  email: string;
  name?: string | null;
  accountType?: string | null;
  brandName?: string | null;
  phoneNumber?: string | null;
  location?: string | null;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAgency: boolean;
  signIn: (credentials: { email: string; password: string }) => Promise<User>;
  signUp: (payload: Record<string, unknown>) => Promise<User>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/auth/me")
      .then((data) => {
        const d = data as { user: User | null };
        setUser(d?.user ?? null);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const signIn = useCallback(async ({ email, password }: { email: string; password: string }) => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      const d = data as { user: User };
      if (!d?.user) throw new ApiError("Invalid response from server.", 0);
      setUser(d.user);
      return d.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (payload: Record<string, unknown>) => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/user", {
        method: "POST",
        body: payload,
      });
      const d = data as { user: User };
      if (!d?.user) throw new ApiError("Invalid response from server.", 0);
      setUser(d.user);
      return d.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAgency: user?.accountType === "agency",
      signIn,
      signUp,
      signOut,
    }),
    [user, loading, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
