"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaCheckCircle } from "react-icons/fa";
import { isEmail, isIndianPhone, requireNonEmpty } from "@/lib/validation";
import "@/styles/Pages.css";

const includedServices = [
  "Competitor Analysis", "Content Planning", "Script Writing", "Voice Over",
  "Video Editing", "Social Media Management", "Meta Ads", "Enquiry Responses",
  "Google Business Management",
];

export default function GetStartedDetails() {
  const router = useRouter();
  const [form, setForm] = useState({ brandName: "", ownerName: "", email: "", phone: "", goal: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!requireNonEmpty(form.brandName)) errors.brandName = "Brand name is required.";
    if (!requireNonEmpty(form.ownerName)) errors.ownerName = "Contact name is required.";
    if (!requireNonEmpty(form.email)) errors.email = "Email is required.";
    else if (!isEmail(form.email)) errors.email = "Enter a valid email address.";
    if (!requireNonEmpty(form.phone)) errors.phone = "Phone number is required.";
    else if (!isIndianPhone(form.phone)) errors.phone = "Enter a valid 10-digit Indian mobile number.";
    if (!requireNonEmpty(form.goal)) errors.goal = "Primary goal is required.";
    return errors;
  };

  const handleBlur = (field: string) => {
    const errs = validate();
    if (errs[field]) setFieldErrors((prev) => ({ ...prev, [field]: errs[field] }));
    else setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setLoading(true);
    const params = new URLSearchParams({
      brandName: form.brandName.trim(),
      ownerName: form.ownerName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      goal: form.goal.trim(),
    });
    router.push(`/purchase?${params.toString()}`);
  };

  const fields: { key: keyof typeof form; label: string; type: string; placeholder: string }[] = [
    { key: "brandName", label: "Brand Name", type: "text", placeholder: "Your brand name" },
    { key: "ownerName", label: "Owner / Contact Person", type: "text", placeholder: "Your name" },
    { key: "email", label: "Email Address", type: "email", placeholder: "you@brand.com" },
    { key: "phone", label: "Phone Number", type: "tel", placeholder: "+91 9XXXXXXXXX" },
    { key: "goal", label: "Primary Goal", type: "text", placeholder: "Leads / Sales / Brand Awareness" },
  ];

  return (
    <section className="PageShell">
      <div className="PageHero">
        <p className="PageTag">Get Started</p>
        <h1 className="PageTitle">Tell Us About Your Business</h1>
        <p className="PageLead">
          Share a few details so we can align your package and move you to the
          purchase page with the right plan context.
        </p>
      </div>

      <div className="PageSection">
        <div className="DetailsLayout">
          <article className="InfoCard DetailsLeft">
            <h3 style={{ marginBottom: "10px" }}>Included Services Before Purchase</h3>
            <ul className="FeatureList">
              {includedServices.map((s) => (
                <li key={s}><FaCheckCircle /><span>{s}</span></li>
              ))}
            </ul>
          </article>

          <form className="SignInForm DetailsRight" onSubmit={handleSubmit} noValidate>
            {fields.map(({ key, label, type, placeholder }) => (
              <div key={key} className="Field">
                <label htmlFor={key}>{label}</label>
                <input
                  id={key} name={key} type={type} placeholder={placeholder}
                  value={form[key]}
                  onChange={handleChange} onBlur={() => handleBlur(key)}
                  aria-invalid={Boolean(fieldErrors[key])}
                  aria-describedby={fieldErrors[key] ? `${key}-error` : undefined}
                  required
                />
                {fieldErrors[key] && <p id={`${key}-error`} className="FieldError">{fieldErrors[key]}</p>}
              </div>
            ))}

            <button type="submit" className="PrimaryBtn" disabled={loading}>
              {loading ? "Continuing..." : "Continue to Purchase"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
