"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { isEmail, requireNonEmpty } from "@/lib/validation";
import "@/styles/Pages.css";

export default function Subscribe() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ name: "", email: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!requireNonEmpty(form.name)) errors.name = "Full name is required.";
    if (!requireNonEmpty(form.email)) errors.email = "Email is required.";
    else if (!isEmail(form.email)) errors.email = "Enter a valid email address.";
    return errors;
  };

  const handleBlur = (field: string) => {
    const errs = validate();
    if (errs[field]) setFieldErrors((prev) => ({ ...prev, [field]: errs[field] }));
    else setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 500));
    setSubmitting(false);
    setSubmitted(true);
  };

  if (authLoading) {
    return (
      <div className="PageSpinner">
        <div className="Spinner" role="status" aria-label="Loading" />
      </div>
    );
  }

  return (
    <section className="PageShell">
      <div className="PageHero">
        <p className="PageTag">Subscribe</p>
        <h1 className="PageTitle">Join Forward Growth Updates</h1>
        <p className="PageLead">
          Subscribe to receive campaign tips, content strategy ideas, and
          practical digital marketing updates from FORWARD Agency.
        </p>
      </div>

      {submitted ? (
        <div className="PageSection">
          <article className="InfoCard HighlightCard">
            <h3>You&apos;re subscribed!</h3>
            <p style={{ marginTop: "8px" }}>Thank you for joining. We&apos;ll send updates to {form.email}.</p>
          </article>
        </div>
      ) : !isAuthenticated ? (
        <div className="PageSection">
          <article className="InfoCard" style={{ maxWidth: "620px" }}>
            <h3>Sign Up Required</h3>
            <p>To subscribe, please create your account first. After sign-up, you will be redirected here automatically.</p>
            <div style={{ marginTop: "14px" }}>
              <Link
                href="/signup"
                className="PrimaryBtn"
                style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", width: "220px" }}
              >
                Go to Sign Up
              </Link>
            </div>
          </article>
        </div>
      ) : (
        <div className="PageSection">
          <form className="SignInForm" style={{ maxWidth: "560px" }} onSubmit={handleSubmit} noValidate>
            <div className="Field">
              <label htmlFor="sub-name">Full Name</label>
              <input
                id="sub-name" name="name" type="text" placeholder="Your name"
                value={form.name || user?.name || ""}
                onChange={handleChange} onBlur={() => handleBlur("name")}
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? "name-error" : undefined}
                required
              />
              {fieldErrors.name && <p id="name-error" className="FieldError">{fieldErrors.name}</p>}
            </div>

            <div className="Field">
              <label htmlFor="sub-email">Email Address</label>
              <input
                id="sub-email" name="email" type="email" placeholder="you@brand.com"
                value={form.email || user?.email || ""}
                onChange={handleChange} onBlur={() => handleBlur("email")}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                required
              />
              {fieldErrors.email && <p id="email-error" className="FieldError">{fieldErrors.email}</p>}
            </div>

            <button type="submit" className="PrimaryBtn" disabled={submitting}>
              {submitting ? "Subscribing..." : "Subscribe Now"}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
