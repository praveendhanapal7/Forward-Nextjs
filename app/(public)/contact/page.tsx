"use client";

import { useState } from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { isEmail, requireNonEmpty } from "@/lib/validation";
import "@/styles/Pages.css";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [alert, setAlert] = useState<{ type: string; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!requireNonEmpty(form.name)) errors.name = "Name is required.";
    if (!requireNonEmpty(form.email)) errors.email = "Email is required.";
    else if (!isEmail(form.email)) errors.email = "Enter a valid email address.";
    if (!requireNonEmpty(form.message)) errors.message = "Message is required.";
    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
      await apiFetch("/api/contact", { method: "POST", body: form });
      setAlert({ type: "success", message: "Enquiry sent! We will be in touch soon." });
      setForm({ name: "", email: "", message: "" });
    } catch (error) {
      setAlert({
        type: "error",
        message: error instanceof ApiError ? error.message : "Unable to send enquiry. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="PageShell">
      <div className="PageHero">
        <p className="PageTag">Contact</p>
        <h1 className="PageTitle">Talk to FORWARD Team</h1>
        <p className="PageLead">
          Share your business goals and we&apos;ll recommend a practical growth plan
          across strategy, content, ads, and enquiry workflows.
        </p>
      </div>

      <div className="SignInWrap">
        <article className="InfoCard">
          <h3>Contact Details</h3>
          <div className="ContactDetail">
            <Mail size={16} />
            <span>hello@forwardagency.in</span>
          </div>
          <div className="ContactDetail">
            <Phone size={16} />
            <span>+91 93610 45774</span>
          </div>
          <div className="ContactDetail">
            <Phone size={16} />
            <span>+91 94430 69400</span>
          </div>
          <div className="ContactDetail">
            <MapPin size={16} />
            <span>Ondipudur Coimbatore, Tamil Nadu, India</span>
          </div>
        </article>

        <form className="SignInForm" onSubmit={handleSubmit} noValidate>
          <div className="Field">
            <label htmlFor="contact-name">Name</label>
            <input
              id="contact-name" name="name" type="text" autoComplete="name"
              placeholder="Your name" value={form.name}
              onChange={handleChange} onBlur={() => handleBlur("name")}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? "name-error" : undefined}
              required
            />
            {fieldErrors.name && <p id="name-error" className="FieldError">{fieldErrors.name}</p>}
          </div>

          <div className="Field">
            <label htmlFor="contact-email">Email</label>
            <input
              id="contact-email" name="email" type="email" autoComplete="email"
              placeholder="you@brand.com" value={form.email}
              onChange={handleChange} onBlur={() => handleBlur("email")}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
              required
            />
            {fieldErrors.email && <p id="email-error" className="FieldError">{fieldErrors.email}</p>}
          </div>

          <div className="Field">
            <label htmlFor="contact-message">Message</label>
            <textarea
              id="contact-message" name="message"
              placeholder="Tell us your requirement"
              value={form.message}
              onChange={handleChange} onBlur={() => handleBlur("message")}
              aria-invalid={Boolean(fieldErrors.message)}
              aria-describedby={fieldErrors.message ? "message-error" : undefined}
              rows={4}
              required
            />
            {fieldErrors.message && <p id="message-error" className="FieldError">{fieldErrors.message}</p>}
          </div>

          <button type="submit" className="PrimaryBtn" disabled={loading}>
            {loading ? "Sending..." : "Send Enquiry"}
          </button>

          {alert && (
            <p className={`FormAlert FormAlert--${alert.type}`} role={alert.type === "error" ? "alert" : "status"}>
              {alert.message}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
