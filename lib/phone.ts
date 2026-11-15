export function formatPhoneNumber(raw: string | null | undefined): string | null {
  if (!raw) return raw ?? null;
  const cleaned = raw.replace(/\s/g, "");
  if (cleaned.length < 10) return raw;
  return "+91" + cleaned.slice(-10);
}
