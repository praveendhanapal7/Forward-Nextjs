"use client";

import { useEffect } from "react";
import Link from "next/link";
import "@/styles/Pages.css";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="PageShell">
      <div className="PageHero">
        <p className="PageTag">Error</p>
        <h1 className="PageTitle">Something went wrong</h1>
        <p className="PageLead">
          An unexpected error occurred. You can try again or return to the home page.
          {error.digest && (
            <span style={{ display: "block", marginTop: 8, fontSize: 12, color: "#9ca3af" }}>
              Reference: {error.digest}
            </span>
          )}
        </p>
      </div>
      <div className="PageSection" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button type="button" className="PrimaryBtn" onClick={reset} style={{ maxWidth: 160 }}>
          Try Again
        </button>
        <Link
          href="/"
          className="PrimaryBtn"
          style={{ maxWidth: 160, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#fff", color: "#ce050d", border: "1px solid #ce050d", textDecoration: "none" }}
        >
          Go Home
        </Link>
      </div>
    </section>
  );
}
