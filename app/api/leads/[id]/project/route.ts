import { resolveUser, isAgency } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await resolveUser();
    if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const leadId = parseInt(id, 10);
    if (isNaN(leadId)) {
      return Response.json({ message: "Invalid lead ID" }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const projectId: string | null = body?.projectId ?? null;

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return Response.json({ message: "Lead not found" }, { status: 404 });

    if (!isAgency(user) && lead.clientName !== user.brandName) {
      return Response.json({ message: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: { projectId },
    });

    return Response.json(updated);
  } catch {
    return Response.json({ message: "Something went wrong" }, { status: 500 });
  }
}
