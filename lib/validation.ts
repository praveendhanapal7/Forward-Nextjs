const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INDIAN_PHONE_RE = /^(\+?91[-\s]?)?[6-9]\d{9}$/;

export function isEmail(value: string): boolean {
  if (typeof value !== "string") return false;
  return EMAIL_RE.test(value.trim());
}

export function isIndianPhone(value: string): boolean {
  if (typeof value !== "string") return false;
  const cleaned = value.replace(/[\s-]/g, "");
  return INDIAN_PHONE_RE.test(cleaned);
}

export function passwordStrength(password: string): {
  valid: boolean;
  checks: { minLength: boolean; hasLetter: boolean; hasDigit: boolean };
  score: number;
  label: "Too weak" | "Weak" | "Okay" | "Strong";
} {
  const pw = typeof password === "string" ? password : "";
  const checks = {
    minLength: pw.length >= 8,
    hasLetter: /[A-Za-z]/.test(pw),
    hasDigit: /\d/.test(pw),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const valid = checks.minLength && checks.hasLetter && checks.hasDigit;

  let label: "Too weak" | "Weak" | "Okay" | "Strong" = "Too weak";
  if (valid) label = "Strong";
  else if (passed === 2) label = "Okay";
  else if (passed === 1) label = "Weak";

  return { valid, checks, score: passed, label };
}

export function requireNonEmpty(value: string): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
