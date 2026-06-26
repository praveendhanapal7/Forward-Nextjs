import { compare } from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sessionCookie, normalizeAccountType } from "@/lib/auth";
import { LoginSchema } from "@/lib/schemas";
import { loginLimiter, checkLimit } from "@/lib/ratelimit";

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const allowed = await checkLimit(loginLimiter, ip);
    if (!allowed) {
      return Response.json(
        { message: "Too many login attempts. Please try again in 15 minutes." },
        { status: 429 },
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ message: "Invalid request" }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.password) {
      return Response.json(
        { message: "Invalid email or password" },
        { status: 401 },
      );
    }

    const valid = await compare(password, user.password);
    if (!valid) {
      return Response.json(
        { message: "Invalid email or password" },
        { status: 401 },
      );
    }

    const normalizedType = normalizeAccountType(
      user.accountType,
      user.brandName,
    );
    if (normalizedType !== user.accountType) {
      await prisma.user.update({
        where: { email },
        data: { accountType: normalizedType },
      });
      user.accountType = normalizedType;
    }

    const token = randomBytes(32).toString("base64url");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000);

    await prisma.userSession.create({
      data: { token, userEmail: email, createdAt: now, expiresAt },
    });

    const headers = new Headers();
    headers.set("Set-Cookie", sessionCookie(token, SESSION_TTL_SECONDS));

    return Response.json(
      {
        user: {
          email: user.email,
          name: user.name,
          accountType: user.accountType,
          brandName: user.brandName,
          phoneNumber: user.phoneNumber,
          location: user.location,
        },
      },
      { headers },
    );
  } catch {
    return Response.json({ message: "Something went wrong" }, { status: 500 });
  }
}
