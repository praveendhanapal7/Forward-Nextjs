import { cookies } from "next/headers";
import { prisma } from "./prisma";

const SESSION_COOKIE = "session";

export async function resolveUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.userSession.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.userSession.delete({ where: { token } }).catch(() => null);
    }
    return null;
  }

  // Suspended accounts are treated as unauthenticated
  const perms = session.user.permissions as { isActive?: boolean } | null;
  if (perms && perms.isActive === false) return null;

  return session.user;
}

export function sessionCookie(token: string, ttlSeconds: number): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${token}; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=${ttlSeconds}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}

export function isAgency(user: { accountType?: string | null }): boolean {
  return user.accountType === "agency";
}

export function normalizeAccountType(
  raw: string | null | undefined,
  brandName: string | null | undefined,
): string {
  const key = (raw ?? "").trim().toLowerCase();
  switch (key) {
    case "agency":
    case "agency staff":
      return "agency";
    case "staff":
      return "staff";
    case "client":
    case "brand owner":
      return "client";
    case "":
      return brandName ? "client" : "staff";
    default:
      return "client";
  }
}
