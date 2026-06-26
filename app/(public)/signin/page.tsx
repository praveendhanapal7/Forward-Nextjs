"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import GuestRoute from "@/components/auth/GuestRoute";
import { isEmail } from "@/lib/validation";
import { ApiError } from "@/lib/api";
import "@/styles/Pages.css";

const portalItems = [
  "Weekly target performance summary",
  "Campaign status and quality-check updates",
  "Creative delivery history and revision notes",
  "Enquiry response tracking and follow-up status",
  "Support channel for fast communication",
];

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [alert, setAlert] = useState<{ type: string; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!email.trim()) errors.email = "Email is required.";
    else if (!isEmail(email)) errors.email = "Enter a valid email address.";
    if (!password) errors.password = "Password is required.";
    return errors;
  };

  const handleBlur = (field: string) => {
    const errs = validate();
    if (errs[field]) setFieldErrors((prev) => ({ ...prev, [field]: errs[field] }));
    else setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setLoading(true);
    try {
      await signIn({ email: email.trim(), password });
      const redirectTo = searchParams.get("from") || "/dashboard";
      router.replace(redirectTo);
    } catch (error) {
      setAlert({ type: "error", message: error instanceof ApiError ? error.message : "Unable to sign in. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="PageShell">
      <div className="PageHero">
        <p className="PageTag">Client Portal</p>
        <h1 className="PageTitle">Sign In for Reports, Progress, and Deliverables</h1>
        <p className="PageLead">
          This portal is designed for Forward clients and staff who need clear
          visibility into campaign progress, lead requirements, and execution updates.
        </p>
      </div>

      <div className="SignInWrap">
        <div className="InfoCard">
          <h3>What You Can Access</h3>
          <p>Staff can add lead numbers and requirements. Clients can view all lead entries and track updates from one dashboard.</p>
          <ul className="FeatureList" style={{ marginTop: 14 }}>
            {portalItems.map((item) => (
              <li key={item}><CheckCircle2 size={16} /><span>{item}</span></li>
            ))}
          </ul>
        </div>

        <form className="SignInForm" onSubmit={handleSubmit} noValidate>
          <div className="Field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email" name="email" type="email" autoComplete="email"
              placeholder="you@brand.com" value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur("email")}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
              required
            />
            {fieldErrors.email && <p id="email-error" className="FieldError">{fieldErrors.email}</p>}
          </div>

          <div className="Field">
            <label htmlFor="password">Password</label>
            <div className="FieldPasswordWrap">
              <input
                id="password" name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password" placeholder="Enter password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur("password")}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? "password-error" : undefined}
                required
              />
              <button
                type="button" className="FieldPasswordToggle"
                onClick={() => setShowPassword((p) => !p)} tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {fieldErrors.password && <p id="password-error" className="FieldError">{fieldErrors.password}</p>}
          </div>

          <button type="submit" className="PrimaryBtn" disabled={loading}>
            {loading ? "Signing In…" : "Sign In"}
          </button>

          {alert && (
            <p className={`FormAlert FormAlert--${alert.type}`} role={alert.type === "error" ? "alert" : "status"}>
              {alert.message}
            </p>
          )}

          <p className="MutedText">Need portal access? <Link href="/contact">Contact Forward Agency support.</Link></p>
          <p className="MutedText">New here? <Link href="/signup">Create an account</Link></p>
        </form>
      </div>
    </section>
  );
}

export default function SignInPage() {
  return (
    <GuestRoute>
      <SignInForm />
    </GuestRoute>
  );
}
