"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", margin: 0, background: "#fff5f5" }}>
        <div style={{ textAlign: "center", padding: "40px 24px", maxWidth: 480 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#ce050d", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Critical Error</p>
          <h1 style={{ fontSize: 36, fontWeight: 700, margin: "0 0 16px", color: "#111" }}>Something went seriously wrong</h1>
          <p style={{ fontSize: 16, color: "#555", lineHeight: 1.65, marginBottom: 28 }}>
            The application encountered an unrecoverable error. Please try again.
            {error.digest && (
              <span style={{ display: "block", marginTop: 8, fontSize: 12, color: "#9ca3af" }}>
                Ref: {error.digest}
              </span>
            )}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={reset}
              style={{ height: 46, padding: "0 28px", background: "#ce050d", color: "#fff", border: "1px solid #ce050d", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer" }}
            >
              Try Again
            </button>
            <a
              href="/"
              style={{ height: 46, padding: "0 28px", background: "#fff", color: "#ce050d", border: "1px solid #ce050d", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", textDecoration: "none" }}
            >
              Go Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
