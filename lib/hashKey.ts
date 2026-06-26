import { createHmac } from "crypto";

export function hashSecretKey(raw: string): string {
  const secret = process.env.SECRET_KEY_HMAC_SECRET;
  if (!secret) throw new Error("SECRET_KEY_HMAC_SECRET is not set");
  return createHmac("sha256", secret)
    .update(raw.trim().toLowerCase())
    .digest("hex");
}
