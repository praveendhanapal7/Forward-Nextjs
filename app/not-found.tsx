import Link from "next/link";
import "@/styles/Pages.css";

export default function NotFound() {
  return (
    <section className="PageShell">
      <div className="PageHero">
        <p className="PageTag">404</p>
        <h1 className="PageTitle">Page Not Found</h1>
        <p className="PageLead">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Check the URL or head back to safety.
        </p>
      </div>
      <div className="PageSection" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link
          href="/"
          className="PrimaryBtn"
          style={{ maxWidth: 200, display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
        >
          Back to Home
        </Link>
        <Link
          href="/dashboard"
          className="PrimaryBtn"
          style={{ maxWidth: 200, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#fff", color: "#ce050d", border: "1px solid #ce050d", textDecoration: "none" }}
        >
          Go to Dashboard
        </Link>
      </div>
    </section>
  );
}
