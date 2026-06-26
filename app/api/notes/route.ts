import { resolveUser, isAgency } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotesSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const user = await resolveUser();
    if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => null);
    const parsed = NotesSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ message: "Invalid request" }, { status: 400 });
    }

    const { id, notes } = parsed.data;
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return Response.json({ message: "Lead not found" }, { status: 404 });
    }

    if (!isAgency(user) && lead.clientName !== user.brandName) {
      return Response.json({ message: "Forbidden" }, { status: 403 });
    }

    const actor = isAgency(user) ? `${user.name} (Agency Member)` : user.name ?? "";
    const action = lead.notes ? "Notes updated" : "Notes added";
    const time = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const entry = `[${time}] ${action} by ${actor}`;
    const newLog = lead.log ? `${lead.log}\n${entry}` : entry;

    const updated = await prisma.lead.update({
      where: { id },
      data: { notes, log: newLog },
    });

    return Response.json(updated);
  } catch {
    return Response.json({ message: "Something went wrong" }, { status: 500 });
  }
}
