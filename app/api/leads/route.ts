import { resolveUser, isAgency } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeadSchema } from "@/lib/schemas";

function formatPhoneNumber(raw: string | null | undefined): string | null {
  if (!raw) return raw ?? null;
  const cleaned = raw.replace(/\s/g, "");
  if (cleaned.length < 10) return raw;
  return "+91" + cleaned.slice(-10);
}

function appendAuditLog(current: string | null | undefined, action: string, actor: string): string {
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

export async function GET(request: Request) {
  try {
    const user = await resolveUser();
    if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") ?? undefined;

    const baseWhere = isAgency(user)
      ? {}
      : user.brandName
        ? { clientName: user.brandName }
        : null;

    if (baseWhere === null) return Response.json([]);

    const where = {
      ...baseWhere,
      ...(projectId && { projectId }),
    };

    const leads = await prisma.lead.findMany({ where, orderBy: { id: "desc" } });
    return Response.json(leads);
  } catch {
    return Response.json({ message: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await resolveUser();
    if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => null);
    const parsed = LeadSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ message: "Invalid request" }, { status: 400 });
    }

    const data = parsed.data;
    const clientName = isAgency(user)
      ? (data.clientName ?? null)
      : user.brandName ?? null;

    if (isAgency(user) && !clientName) {
      return Response.json({ message: "Client name is required" }, { status: 400 });
    }

    const addedBy = data.addedBy?.trim() ||
      (isAgency(user) ? `${user.name} (Agency Member)` : user.name ?? "");

    const lead = await prisma.lead.create({
      data: {
        phoneNumber: formatPhoneNumber(data.phoneNumber),
        requirements: data.requirements ?? null,
        clientName,
        enquiryEntry: data.enquiryEntry ?? new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        addedBy,
        status: data.status ?? "NEW",
        link: data.link ?? null,
        log: appendAuditLog(null, "Lead added", addedBy),
      },
    });

    return Response.json(lead, { status: 201 });
  } catch {
    return Response.json({ message: "Something went wrong" }, { status: 500 });
  }
}
