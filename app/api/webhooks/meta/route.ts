import { prisma } from "@/lib/prisma";
import { createHmac } from "crypto";

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN ?? "";
const APP_SECRET = process.env.META_APP_SECRET ?? "";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  if (APP_SECRET) {
    const sig = request.headers.get("x-hub-signature-256") ?? "";
    const expected = "sha256=" + createHmac("sha256", APP_SECRET).update(rawBody).digest("hex");
    if (sig !== expected) {
      return Response.json({ message: "Invalid signature" }, { status: 403 });
    }
  }

  let payload: MetaWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ message: "Invalid JSON" }, { status: 400 });
  }

  if (payload.object !== "page") {
    return new Response("OK", { status: 200 });
  }

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "leadgen") continue;

      const { leadgen_id, page_id, form_id } = change.value;
      const externalId = `meta_${leadgen_id}`;

      // Skip duplicates
      const existingLead = await prisma.lead.findUnique({ where: { externalId } });
      if (existingLead) continue;

      // Look up integration by form_id
      const integration = await prisma.metaIntegration.findUnique({
        where: { formId: form_id },
        select: {
          id: true, name: true, clientName: true, pageName: true, formName: true,
          pageAccessToken: true, status: true, projectId: true,
        },
      });

      // Log the incoming event (upsert in case of duplicate webhook delivery)
      let logEntry;
      try {
        logEntry = await prisma.leadLog.upsert({
          where: { leadgenId: leadgen_id },
          create: {
            leadgenId: leadgen_id,
            formId: form_id,
            formName: integration?.formName ?? null,
            integrationId: integration?.id ?? null,
            source: "meta",
            status: "PENDING",
            rawData: { leadgen_id, page_id, form_id },
          },
          update: {},
        });
      } catch {
        continue;
      }

      // If no matching integration or it's paused, fail the log
      if (!integration || integration.status !== "active") {
        await prisma.leadLog.update({
          where: { id: logEntry.id },
          data: {
            status: "FAILED",
            failureReason: !integration
              ? `No integration found for form ${form_id}`
              : "Integration is paused",
          },
        });
        continue;
      }

      // Fetch lead details using the page-specific access token
      const leadData = await fetchMetaLead(leadgen_id, integration.pageAccessToken);
      if (!leadData) {
        await prisma.leadLog.update({
          where: { id: logEntry.id },
          data: { status: "FAILED", failureReason: "Failed to fetch lead data from Meta API" },
        });
        continue;
      }

      const dynamicData: Record<string, string> = {};
      let phone: string | null = null;
      let fullName: string | null = null;

      for (const field of leadData.field_data ?? []) {
        const val = field.values?.[0] ?? "";
        dynamicData[field.name] = val;
        if (field.name === "phone_number" || field.name === "phone") phone = val;
        if (field.name === "full_name" || field.name === "first_name") fullName = val;
      }

      const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

      try {
        await prisma.lead.create({
          data: {
            source: "meta",
            externalId,
            phoneNumber: phone,
            clientName: integration.clientName ?? integration.pageName ?? null,
            requirements: fullName ?? null,
            enquiryEntry: now,
            addedBy: `Meta Ad (${integration.formName})`,
            status: "NEW",
            data: dynamicData,
            log: `[${now}] Lead received from Meta form "${integration.formName}"`,
            ...(integration.projectId && { projectId: integration.projectId }),
          },
        });

        await prisma.leadLog.update({
          where: { id: logEntry.id },
          data: {
            status: "SUCCESS",
            rawData: { leadgen_id, page_id, form_id, field_data: leadData.field_data },
          },
        });
      } catch (err) {
        await prisma.leadLog.update({
          where: { id: logEntry.id },
          data: {
            status: "FAILED",
            failureReason: err instanceof Error ? err.message : "Database error",
          },
        });
      }
    }
  }

  return new Response("EVENT_RECEIVED", { status: 200 });
}

async function fetchMetaLead(leadgenId: string, pageToken: string): Promise<MetaLeadResponse | null> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${leadgenId}?access_token=${pageToken}&fields=id,created_time,field_data`,
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

interface MetaWebhookPayload {
  object: string;
  entry?: Array<{
    id: string;
    time: number;
    changes?: Array<{
      field: string;
      value: { leadgen_id: string; page_id: string; form_id: string; created_time: number };
    }>;
  }>;
}

interface MetaLeadResponse {
  id: string;
  created_time: number;
  field_data: Array<{ name: string; values: string[] }>;
}
