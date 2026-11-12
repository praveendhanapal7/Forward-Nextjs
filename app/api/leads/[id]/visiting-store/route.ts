import { resolveUser, isAgency } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VisitingStoreSchema } from "@/lib/schemas";

const VISITING_STORE_STATUS = "VISITING_STORE";

function appendVisitLog(current: string | null | undefined, action: string, actor: string) {
  const time = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const entry = `[${time}] ${action} by ${actor || "Unknown user"}`;
  return current ? `${current}\n${entry}` : entry;
}

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
    const parsed = VisitingStoreSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ message: "Valid visiting store date is required" }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return Response.json({ message: "Lead not found" }, { status: 404 });
    }

    if (!isAgency(user) && lead.clientName !== user.brandName) {
      return Response.json({ message: "Forbidden" }, { status: 403 });
    }

    const actor = isAgency(user) ? `${user.name} (Agency Member)` : user.name ?? "";
    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: VISITING_STORE_STATUS,
        visitingStoreDate: parsed.data.visitingStoreDate,
        log: appendVisitLog(lead.log, `Visiting Store scheduled for ${parsed.data.visitingStoreDate}`, actor),
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId,
        userEmail: user.email,
        userName: actor,
        action: "visit_assigned",
        details: `Visiting Store scheduled for ${parsed.data.visitingStoreDate}`,
      },
    }).catch(() => {});

    return Response.json(updated);
  } catch {
    return Response.json({ message: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    void _request;
    const user = await resolveUser();
    if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const leadId = parseInt(id, 10);
    if (isNaN(leadId)) {
      return Response.json({ message: "Invalid lead ID" }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return Response.json({ message: "Lead not found" }, { status: 404 });
    }

    if (!isAgency(user) && lead.clientName !== user.brandName) {
      return Response.json({ message: "Forbidden" }, { status: 403 });
    }

    const actor = isAgency(user) ? `${user.name} (Agency Member)` : user.name ?? "";
    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: {
        visitingStoreDate: null,
        log: appendVisitLog(lead.log, "Removed from Visiting Store schedule", actor),
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId,
        userEmail: user.email,
        userName: actor,
        action: "visit_removed",
        details: "Removed from Visiting Store schedule",
      },
    }).catch(() => {});

    return Response.json(updated);
  } catch {
    return Response.json({ message: "Something went wrong" }, { status: 500 });
  }
}
