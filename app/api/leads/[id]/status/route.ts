import { resolveUser, isAgency } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusSchema } from "@/lib/schemas";

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
    const parsed = StatusSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ message: "Status is required" }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return Response.json({ message: "Lead not found" }, { status: 404 });
    }

    if (!isAgency(user) && lead.clientName !== user.brandName) {
      return Response.json({ message: "Forbidden" }, { status: 403 });
    }

    const actor = isAgency(user) ? `${user.name} (Agency Member)` : user.name ?? "";
    const time = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const entry = `[${time}] Status changed to ${parsed.data.status} by ${actor}`;
    const newLog = lead.log ? `${lead.log}\n${entry}` : entry;

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: { status: parsed.data.status, log: newLog },
    });

    return Response.json(updated);
  } catch {
    return Response.json({ message: "Something went wrong" }, { status: 500 });
  }
}
