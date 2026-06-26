"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FaCheckCircle, FaBullhorn } from "react-icons/fa";
import "@/styles/Pages.css";

const inclusions = [
  "Competitor Analysis", "Content Planning", "Script Writing", "Voice Over",
  "Video Editing", "Social Media Management", "Meta Ads", "Enquiry Responses",
  "Google Business Management",
];

function PurchaseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const brandName = searchParams.get("brandName");
  const ownerName = searchParams.get("ownerName");
  const email     = searchParams.get("email");
  const phone     = searchParams.get("phone");
  const goal      = searchParams.get("goal");

  if (!brandName || !email) {
    router.replace("/get-started");
    return null;
  }

  const handleSendEnquiry = async () => {
    if (submitting) return;
    setSubmitting(true);
    setStatusMessage("");
    await new Promise((r) => setTimeout(r, 600));
    setStatusMessage("Your enquiry has been sent. We will be in touch soon!");
    setSubmitting(false);
  };

  return (
    <section className="PageShell">
      <div className="PageHero">
        <p className="PageTag">Get Started</p>
        <h1 className="PageTitle">Purchase the FORWARD Growth Plan</h1>
        <p className="PageLead">
          This plan is designed for businesses that need strategy, content, ad
          execution, and enquiry support from one focused team.
        </p>
      </div>

      <div className="PageSection">
        <article className="InfoCard" style={{ maxWidth: "480px" }}>
          <h3 style={{ marginBottom: "10px" }}>Your Details</h3>
          {brandName && <p><strong>Brand:</strong> {brandName}</p>}
          {ownerName && <p><strong>Contact:</strong> {ownerName}</p>}
          {email     && <p><strong>Email:</strong> {email}</p>}
          {phone     && <p><strong>Phone:</strong> {phone}</p>}
          {goal      && <p><strong>Goal:</strong> {goal}</p>}
        </article>
      </div>

      <div className="PageSection">
        <article className="InfoCard HighlightCard">
          <div className="IconTitle">
            <span className="CardIcon"><FaBullhorn /></span>
            <h3>Complete Package Price</h3>
          </div>
          <p>Full service plan covering analysis to execution: <strong>₹13,999</strong></p>
        </article>
      </div>

      <div className="PageSection">
        <h2 className="PageSectionTitle">What You Get</h2>
        <article className="InfoCard">
          <ul className="FeatureList">
            {inclusions.map((item) => (
              <li key={item}><FaCheckCircle /><span>{item}</span></li>
            ))}
          </ul>
        </article>
      </div>

      <div className="PageSection" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <button
          type="button" className="PrimaryBtn" onClick={handleSendEnquiry}
          disabled={submitting}
          style={{ maxWidth: "300px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
        >
          {submitting ? "Sending..." : "Contact Team to Complete Purchase"}
        </button>
        <Link
          href="/services" className="PrimaryBtn"
          style={{ maxWidth: "180px", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#fff", color: "#ce050d", border: "1px solid #ce050d", textDecoration: "none" }}
        >
          View Services
        </Link>
      </div>

      {statusMessage && (
        <div className="PageSection">
          <article className="InfoCard">
            <p>{statusMessage}</p>
          </article>
        </div>
      )}
    </section>
  );
}

export default function Purchase() {
  return (
    <Suspense fallback={<div className="PageSpinner"><div className="Spinner" /></div>}>
      <PurchaseContent />
    </Suspense>
  );
}
