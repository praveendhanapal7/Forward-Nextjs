import { resolveUser, isAgency } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
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

    // Check canDeleteLeads permission (default: allowed)
    const perms = (user.permissions as { canDeleteLeads?: boolean } | null) ?? {};
    if (perms.canDeleteLeads === false) {
      return Response.json({ message: "You don't have permission to delete leads" }, { status: 403 });
    }

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return Response.json({ message: "Lead not found" }, { status: 404 });

    if (!isAgency(user) && lead.clientName !== user.brandName) {
      return Response.json({ message: "Forbidden" }, { status: 403 });
    }

    await prisma.lead.delete({ where: { id: leadId } });
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ message: "Something went wrong" }, { status: 500 });
  }
}
