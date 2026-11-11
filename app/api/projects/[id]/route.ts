import { resolveUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await resolveUser();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { name, description } = body;

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
    },
  });

  return Response.json(project);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await resolveUser();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Unlink integrations and sources instead of cascading delete
  await prisma.$transaction([
    prisma.metaIntegration.updateMany({ where: { projectId: id }, data: { projectId: null } }),
    prisma.leadSource.updateMany({ where: { projectId: id }, data: { projectId: null } }),
    prisma.project.delete({ where: { id } }),
  ]);

  return Response.json({ success: true });
}
