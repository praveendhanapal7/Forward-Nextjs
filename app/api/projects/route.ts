import { resolveUser, isAgency } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await resolveUser();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

  // Staff: only return their assigned projects
  if (!isAgency(user) && user.accountType === "staff") {
    const assignments = await prisma.userProject.findMany({
      where: { userEmail: user.email },
      select: { project: { include: { _count: { select: { integrations: true, sources: true } } } } },
    });
    return Response.json(assignments.map((a) => a.project));
  }

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { integrations: true, sources: true } },
    },
  });

  return Response.json(projects);
}

export async function POST(request: Request) {
  const user = await resolveUser();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, description } = body;

  if (!name?.trim()) {
    return Response.json({ message: "Name is required" }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      createdBy: user.email,
    },
  });

  return Response.json(project, { status: 201 });
}
