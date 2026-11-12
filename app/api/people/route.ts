import { resolveUser, isAgency } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isOwner(user: { accountType?: string | null }) {
  return user.accountType === "client" || isAgency(user);
}

export async function GET() {
  try {
    const user = await resolveUser();
    if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });
    if (!isOwner(user)) return Response.json({ message: "Forbidden" }, { status: 403 });

    const where = isAgency(user)
      ? {} // agency sees everyone
      : { secretKey: user.secretKey };

    const people = await prisma.user.findMany({
      where,
      select: {
        email: true,
        name: true,
        phoneNumber: true,
        location: true,
        accountType: true,
        brandName: true,
        permissions: true,
        sessions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
        assignedProjects: {
          select: {
            projectId: true,
            project: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { email: "asc" },
    });

    return Response.json(people);
  } catch {
    return Response.json({ message: "Something went wrong" }, { status: 500 });
  }
}
