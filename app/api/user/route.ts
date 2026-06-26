import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sessionCookie, normalizeAccountType } from "@/lib/auth";
import { hashSecretKey } from "@/lib/hashKey";
import { RegisterSchema } from "@/lib/schemas";
import { registerLimiter, checkLimit } from "@/lib/ratelimit";

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const allowed = await checkLimit(registerLimiter, ip);
    if (!allowed) {
      return Response.json(
        { message: "Too many registration attempts. Please try again later." },
        { status: 429 },
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ message: "Invalid request" }, { status: 400 });
    }

    const { name, email, phoneNumber, location, accountType, brandName, password, secretKey } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json({ message: "User already exists" }, { status: 409 });
    }

    const keyHash = hashSecretKey(secretKey);
    const accessModel = await prisma.accessModel.findUnique({ where: { secretKeyHash: keyHash } });

    let resolvedBrandName = brandName ?? null;

    if (resolvedBrandName) {
      if (!accessModel) {
        await prisma.accessModel.create({
          data: { secretKeyHash: keyHash, brandName: resolvedBrandName },
        });
      } else if (accessModel.brandName !== resolvedBrandName) {
        return Response.json(
          { message: "Access code already belongs to another brand" },
          { status: 409 },
        );
      }
    } else {
      if (!accessModel) {
        return Response.json(
          { message: "Access code is invalid" },
          { status: 400 },
        );
      }
      resolvedBrandName = accessModel.brandName;
    }

    const finalAccountType = normalizeAccountType(accountType, resolvedBrandName);

    if (
      (finalAccountType === "staff" || finalAccountType === "agency") &&
      !resolvedBrandName
    ) {
      return Response.json(
        { message: "Access code is invalid" },
        { status: 400 },
      );
    }

    const hashedPassword = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name: name.trim() || email,
        phoneNumber: phoneNumber.trim() || "NA",
        location: location.trim(),
        accountType: finalAccountType,
        brandName: resolvedBrandName,
        password: hashedPassword,
        secretKey: keyHash,
      },
    });

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
      { status: 201, headers },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Unique constraint")) {
      return Response.json({ message: "User already exists" }, { status: 409 });
    }
    console.error(err);
    return Response.json({ message: "Something went wrong" }, { status: 500 });
  }
}
