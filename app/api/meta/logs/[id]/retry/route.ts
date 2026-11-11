import { resolveUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await resolveUser();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const log = await prisma.leadLog.findUnique({
    where: { id },
    include: { integration: true },
  });

  if (!log) return Response.json({ message: "Log not found" }, { status: 404 });
  if (!log.leadgenId) return Response.json({ message: "No leadgen ID to retry" }, { status: 400 });
  if (!log.integration) return Response.json({ message: "Integration no longer exists" }, { status: 404 });

  // Check for duplicate
  const externalId = `meta_${log.leadgenId}`;
  const existing = await prisma.lead.findUnique({ where: { externalId } });
  if (existing) {
    await prisma.leadLog.update({ where: { id }, data: { status: "SUCCESS", failureReason: null } });
    return Response.json({ success: true, message: "Lead already created" });
  }

  // Fetch lead data from Meta
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${log.leadgenId}?access_token=${log.integration.pageAccessToken}&fields=id,created_time,field_data`,
  );
  if (!res.ok) {
    const err = await res.json();
    const reason = err.error?.message ?? "API error";
    await prisma.leadLog.update({
      where: { id },
      data: { retryCount: { increment: 1 }, failureReason: reason },
    });
    return Response.json({ success: false, message: reason }, { status: 400 });
  }

  const lead = await res.json();
  const dynamicData: Record<string, string> = {};
  let phone: string | null = null;
  let name: string | null = null;

  for (const field of lead.field_data ?? []) {
    const val = field.values?.[0] ?? "";
    dynamicData[field.name] = val;
    if (field.name === "phone_number" || field.name === "phone") phone = val;
    if (field.name === "full_name" || field.name === "first_name") name = val;
  }

  const entryDate = new Date(lead.created_time * 1000).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
  });
  const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  await prisma.lead.create({
    data: {
      source: "meta",
      externalId,
      phoneNumber: phone,
      clientName: name,
      enquiryEntry: entryDate,
      addedBy: `Meta Ad (${log.integration.formName})`,
      status: "NEW",
      data: dynamicData,
      log: `[${now}] Lead retried from Meta form "${log.integration.formName}"`,
    },
  });

  await prisma.leadLog.update({
    where: { id },
    data: {
      status: "SUCCESS",
      failureReason: null,
      retryCount: { increment: 1 },
    },
  });

  return Response.json({ success: true });
}
