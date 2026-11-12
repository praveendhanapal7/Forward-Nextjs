import { resolveUser, isAgency } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isOwner(user: { accountType?: string | null }) {
  return user.accountType === "client" || isAgency(user);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ email: string }> },
) {
  try {
    const user = await resolveUser();
    if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });
    if (!isOwner(user)) return Response.json({ message: "Forbidden" }, { status: 403 });

    const { email } = await params;
    const targetEmail = decodeURIComponent(email);

    if (targetEmail === user.email) {
      return Response.json({ message: "Cannot modify your own permissions" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { email: targetEmail } });
    if (!target) return Response.json({ message: "User not found" }, { status: 404 });

    // Non-agency owners can only manage users under their own secretKey
    if (!isAgency(user) && target.secretKey !== user.secretKey) {
      return Response.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return Response.json({ message: "Invalid request" }, { status: 400 });
    }

    const existing = (target.permissions ?? {}) as Record<string, unknown>;
    const updated = { ...existing };
    if (typeof body.isActive === "boolean") updated.isActive = body.isActive;
    if (typeof body.canDeleteLeads === "boolean") updated.canDeleteLeads = body.canDeleteLeads;

    const result = await prisma.user.update({
      where: { email: targetEmail },
      data: { permissions: updated },
      select: { email: true, name: true, accountType: true, brandName: true, permissions: true },
    });

    return Response.json(result);
  } catch {
    return Response.json({ message: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ email: string }> },
) {
  try {
    const user = await resolveUser();
    if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });
    if (!isOwner(user)) return Response.json({ message: "Forbidden" }, { status: 403 });

    const { email } = await params;
    const targetEmail = decodeURIComponent(email);

    if (targetEmail === user.email) {
      return Response.json({ message: "Cannot delete your own account" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { email: targetEmail } });
    if (!target) return Response.json({ message: "User not found" }, { status: 404 });

    if (!isAgency(user) && target.secretKey !== user.secretKey) {
      return Response.json({ message: "Forbidden" }, { status: 403 });
    }

    // Delete sessions first, then user
    await prisma.userSession.deleteMany({ where: { userEmail: targetEmail } });
    await prisma.user.delete({ where: { email: targetEmail } });

    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ message: "Something went wrong" }, { status: 500 });
  }
}
