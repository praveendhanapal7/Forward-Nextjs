import { resolveUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await resolveUser();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const integration = await prisma.metaIntegration.findUnique({
    where: { id },
    select: { id: true, formId: true, formName: true, clientName: true, pageName: true, pageAccessToken: true, projectId: true },
  });
  if (!integration) return Response.json({ message: "Integration not found" }, { status: 404 });

  type MetaLead = { id: string; created_time: number | string; field_data: Array<{ name: string; values: string[] }> };
  const leads: MetaLead[] = [];

  let url: string | null =
    `https://graph.facebook.com/v19.0/${integration.formId}/leads?access_token=${integration.pageAccessToken}&fields=id,created_time,field_data&limit=100`;

  while (url) {
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json();
      return Response.json({ message: err.error?.message ?? "Failed to fetch leads" }, { status: 400 });
    }
    const data = await res.json();
    leads.push(...(data.data ?? []));
    url = data.paging?.next ?? null;
  }

  let created = 0;
  let skipped = 0;

  for (const lead of leads) {
    const externalId = `meta_${lead.id}`;
    const existing = await prisma.lead.findUnique({ where: { externalId } });
    if (existing) { skipped++; continue; }

    const dynamicData: Record<string, string> = {};
    let phone: string | null = null;
    let name: string | null = null;

    for (const field of lead.field_data ?? []) {
      const val = field.values?.[0] ?? "";
      dynamicData[field.name] = val;
      if (field.name === "phone_number" || field.name === "phone") phone = val;
      if (field.name === "full_name" || field.name === "first_name") name = val;
    }

    if (phone) {
      const phoneExists = await prisma.lead.findFirst({
        where: { phoneNumber: phone, clientName: integration.clientName ?? integration.pageName ?? null },
        select: { id: true },
      });
      if (phoneExists) { skipped++; continue; }
    }

    const rawTs = lead.created_time;
    const tsMs = typeof rawTs === "number" ? rawTs * 1000 : new Date(rawTs).getTime();
    const entryDate = new Date(isNaN(tsMs) ? Date.now() : tsMs).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    });
    const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    await prisma.lead.create({
      data: {
        source: "meta",
        externalId,
        phoneNumber: phone,
        clientName: integration.clientName ?? integration.pageName ?? null,
        requirements: name ?? null,
        enquiryEntry: entryDate,
        addedBy: `Meta Ad (${integration.formName})`,
        status: "NEW",
        data: dynamicData,
        log: `[${now}] Lead imported from Meta form "${integration.formName}"`,
        ...(integration.projectId && { projectId: integration.projectId }),
      },
    });
    created++;
  }

  return Response.json({ created, skipped, total: leads.length });
}
