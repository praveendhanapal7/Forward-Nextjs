"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(isAuthenticated ? "/dashboard" : "/home");
  }, [isAuthenticated, loading, router]);

  return (
    <div className="PageSpinner">
      <div className="Spinner" role="status" aria-label="Loading" />
    </div>
  );
}
