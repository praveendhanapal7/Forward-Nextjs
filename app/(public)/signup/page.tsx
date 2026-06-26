"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import GuestRoute from "@/components/auth/GuestRoute";
import { isEmail, isIndianPhone, passwordStrength, requireNonEmpty } from "@/lib/validation";
import { ApiError } from "@/lib/api";
import "@/styles/Pages.css";

const ROLE_OPTIONS = [
  { value: "client", label: "Brand Owner" },
  { value: "staff", label: "Staff" },
  { value: "agency", label: "Agency Staff" },
];

const STRENGTH_COLORS: Record<string, string> = {
  "Too weak": "#dc2626", Weak: "#f97316", Okay: "#eab308", Strong: "#16a34a",
};
const STRENGTH_PERCENT: Record<string, number> = {
  "Too weak": 10, Weak: 35, Okay: 65, Strong: 100,
};

function PasswordField({
  id, name, label, placeholder, autoComplete, value, onChange, onBlur, error, hint,
}: {
  id: string; name: string; label: string; placeholder: string; autoComplete: string;
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void; error?: string; hint?: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="Field">
      <label htmlFor={id}>{label}</label>
      <div className="FieldPasswordWrap">
        <input
          id={id} name={name} type={show ? "text" : "password"}
          autoComplete={autoComplete} placeholder={placeholder}
          value={value} onChange={onChange} onBlur={onBlur}
          aria-invalid={Boolean(error)}
          aria-describedby={`${id}-hint`}
          required
        />
        <button type="button" className="FieldPasswordToggle" onClick={() => setShow((p) => !p)} tabIndex={-1} aria-label={show ? "Hide" : "Show"}>
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
      <div id={`${id}-hint`} className="FieldHintSlot">
        {hint ?? null}
        {error && <p className="FieldError">{error}</p>}
      </div>
    </div>
  );
}

function SignUpForm() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", location: "",
    role: "client", brandName: "", password: "", confirmPassword: "", secretKey: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [alert, setAlert] = useState<{ type: string; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => passwordStrength(form.password), [form.password]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (!fieldErrors[name]) return;
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (name === "password") {
        if (passwordStrength(value).valid) delete next.password;
      } else if (name === "confirmPassword") {
        if (value === form.password) delete next.confirmPassword;
      } else {
        delete next[name];
      }
      return next;
    });
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!requireNonEmpty(form.fullName)) errors.fullName = "Full name is required.";
    if (!requireNonEmpty(form.email)) errors.email = "Email is required.";
    else if (!isEmail(form.email)) errors.email = "Enter a valid email address.";
    if (!requireNonEmpty(form.phone)) errors.phone = "Phone number is required.";
    else if (!isIndianPhone(form.phone)) errors.phone = "Enter a valid 10-digit Indian mobile number.";
    if (!requireNonEmpty(form.location)) errors.location = "Location is required.";
    if (form.role === "client" && !requireNonEmpty(form.brandName)) errors.brandName = "Brand name is required for brand owners.";
    if (!form.password) errors.password = "Password is required.";
    else if (!strength.valid) errors.password = "Use at least 8 characters with letters and digits.";
    if (!form.confirmPassword) errors.confirmPassword = "Please confirm your password.";
    else if (form.confirmPassword !== form.password) errors.confirmPassword = "Passwords do not match.";
    if (!requireNonEmpty(form.secretKey)) errors.secretKey = "Organization access code is required.";
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
      await signUp({
        name: form.fullName.trim(), email: form.email.trim(),
        phoneNumber: form.phone.trim(), location: form.location.trim(),
        accountType: form.role, password: form.password,
        brandName: form.role === "client" ? form.brandName.trim() : null,
        secretKey: form.secretKey,
      });
      router.replace("/dashboard");
    } catch (error) {
      setAlert({ type: "error", message: error instanceof ApiError ? error.message : "Unable to create the account. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const strengthPercent = STRENGTH_PERCENT[strength.label] ?? 0;

  return (
    <section className="PageShell">
      <div className="PageHero">
        <p className="PageTag">Sign Up</p>
        <h1 className="PageTitle">Create Your FORWARD Account</h1>
        <p className="PageLead">
          Sign up first to access subscriptions, growth updates, and premium resources from FORWARD Agency.
        </p>
      </div>

      <div className="PageSection">
        <form className="SignInForm" style={{ maxWidth: 620 }} onSubmit={handleSubmit} noValidate>
          {(["fullName", "email", "phone", "location"] as const).map((field) => {
            const config = {
              fullName: { label: "Full Name", type: "text", autoComplete: "name", placeholder: "Your name", id: "fullName" },
              email: { label: "Email Address", type: "email", autoComplete: "email", placeholder: "you@brand.com", id: "email" },
              phone: { label: "Phone Number", type: "tel", autoComplete: "tel", placeholder: "+91 9XXXXXXXXX", id: "phone" },
              location: { label: "Location", type: "text", autoComplete: "address-level2", placeholder: "City, State", id: "location" },
            }[field];
            return (
              <div key={field} className="Field">
                <label htmlFor={config.id}>{config.label}</label>
                <input
                  id={config.id} name={field} type={config.type}
                  autoComplete={config.autoComplete} placeholder={config.placeholder}
                  value={form[field]} onChange={handleChange}
                  onBlur={() => handleBlur(field)}
                  aria-invalid={Boolean(fieldErrors[field])}
                  aria-describedby={fieldErrors[field] ? `${field}-error` : undefined}
                  required
                />
                {fieldErrors[field] && <p id={`${field}-error`} className="FieldError">{fieldErrors[field]}</p>}
              </div>
            );
          })}

          <div className="Field">
            <label htmlFor="role">Account Type</label>
            <select id="role" name="role" value={form.role} onChange={handleChange}>
              {ROLE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>

          {form.role === "client" && (
            <div className="Field">
              <label htmlFor="brandName">Brand Name</label>
              <input
                id="brandName" name="brandName" type="text" autoComplete="organization"
                placeholder="Your brand name" value={form.brandName}
                onChange={handleChange} onBlur={() => handleBlur("brandName")}
                aria-invalid={Boolean(fieldErrors.brandName)}
                aria-describedby={fieldErrors.brandName ? "brandName-error" : undefined}
                required
              />
              {fieldErrors.brandName && <p id="brandName-error" className="FieldError">{fieldErrors.brandName}</p>}
            </div>
          )}

          <PasswordField
            id="password" name="password" label="Create Password"
            placeholder="Create password" autoComplete="new-password"
            value={form.password} onChange={handleChange}
            onBlur={() => handleBlur("password")}
            error={fieldErrors.password}
            hint={
              form.password ? (
                <div className="PasswordStrength" aria-live="polite">
                  <span className="PasswordStrengthBar">
                    <span className="PasswordStrengthFill" style={{ width: `${strengthPercent}%`, backgroundColor: STRENGTH_COLORS[strength.label] }} />
                  </span>
                  <span style={{ color: STRENGTH_COLORS[strength.label], fontWeight: 600 }}>{strength.label}</span>
                </div>
              ) : undefined
            }
          />

          <PasswordField
            id="confirmPassword" name="confirmPassword" label="Confirm Password"
            placeholder="Re-enter password" autoComplete="new-password"
            value={form.confirmPassword} onChange={handleChange}
            onBlur={() => handleBlur("confirmPassword")}
            error={fieldErrors.confirmPassword}
          />

          <PasswordField
            id="secretKey" name="secretKey"
            label={form.role === "client" ? "Create Organization Access Code" : "Enter the Organization Access Code"}
            placeholder="Access Code" autoComplete="off"
            value={form.secretKey} onChange={handleChange}
            onBlur={() => handleBlur("secretKey")}
            error={fieldErrors.secretKey}
          />

          <button type="submit" className="PrimaryBtn" disabled={loading}>
            {loading ? "Creating Account…" : "Create Account"}
          </button>

          {alert && (
            <p className={`FormAlert FormAlert--${alert.type}`} role={alert.type === "error" ? "alert" : "status"}>
              {alert.message}
            </p>
          )}

          <p className="MutedText">Already have an account? <Link href="/signin">Sign In</Link></p>
        </form>
      </div>
    </section>
  );
}

export default function SignUpPage() {
  return (
    <GuestRoute>
      <SignUpForm />
    </GuestRoute>
  );
}
