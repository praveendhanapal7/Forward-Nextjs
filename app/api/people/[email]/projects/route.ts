import { resolveUser, isAgency } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isOwner(user: { accountType?: string | null }) {
  return user.accountType === "client" || isAgency(user);
}

// PUT /api/people/[email]/projects — replace all assigned projects for a staff member
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ email: string }> },
) {
  try {
    const user = await resolveUser();
    if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });
    if (!isOwner(user)) return Response.json({ message: "Forbidden" }, { status: 403 });

    const { email } = await params;
    const targetEmail = decodeURIComponent(email);

    const target = await prisma.user.findUnique({ where: { email: targetEmail } });
    if (!target) return Response.json({ message: "User not found" }, { status: 404 });

    if (!isAgency(user) && target.secretKey !== user.secretKey) {
      return Response.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body || !Array.isArray(body.projectIds)) {
      return Response.json({ message: "projectIds array is required" }, { status: 400 });
    }

    const projectIds: string[] = body.projectIds;

    // Replace in a transaction: delete existing, then create new
    await prisma.$transaction([
      prisma.userProject.deleteMany({ where: { userEmail: targetEmail } }),
      ...(projectIds.length > 0
        ? [prisma.userProject.createMany({
            data: projectIds.map((projectId) => ({ userEmail: targetEmail, projectId })),
            skipDuplicates: true,
          })]
        : []),
    ]);

    const updated = await prisma.user.findUnique({
      where: { email: targetEmail },
      select: {
        email: true,
        assignedProjects: {
          select: { projectId: true, project: { select: { id: true, name: true } } },
        },
      },
    });

    return Response.json(updated);
  } catch {
    return Response.json({ message: "Something went wrong" }, { status: 500 });
  }
}
