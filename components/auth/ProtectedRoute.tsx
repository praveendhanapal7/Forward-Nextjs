"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/signin");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) return null;
  if (!isAuthenticated) return null;
  return <>{children}</>;
}
