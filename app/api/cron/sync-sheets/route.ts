import { prisma } from "@/lib/prisma";
import { fetchSheetRows } from "../../integrations/sheets/route";

export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const sources = await prisma.leadSource.findMany({
    where: { type: "google_sheets" },
    select: { id: true, name: true, clientName: true, config: true, projectId: true },
  });

  let totalCreated = 0;
  let totalSkipped = 0;
  const errors: string[] = [];

  for (const source of sources) {
    try {
      const cfg = source.config as { spreadsheetId: string; gid?: string | null };
      const data = await fetchSheetRows(cfg.spreadsheetId, cfg.gid ?? null);
      if (!data) {
        errors.push(`${source.name}: could not fetch sheet`);
        continue;
      }

      const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      let created = 0;
      let skipped = 0;

      for (let i = 0; i < data.rows.length; i++) {
        const row = data.rows[i];
        const externalId = `sheet_${source.id}_row_${i + 2}`;

        const phone = findField(row, ["phone", "phone_number", "mobile", "contact"]);
        const name = findField(row, ["name", "full_name", "client_name", "customer"]);
        const sheetStatus = normalizeStatus(findField(row, ["status"]));

        const existing = await prisma.lead.findUnique({ where: { externalId } });
        if (existing) {
          const updates: Record<string, unknown> = {};
          if (source.projectId && !existing.projectId) updates.projectId = source.projectId;
          if (sheetStatus && existing.status !== sheetStatus) updates.status = sheetStatus;
          if (Object.keys(updates).length > 0) {
            await prisma.lead.update({ where: { externalId }, data: updates });
          }
          skipped++;
          continue;
        }

        await prisma.lead.create({
          data: {
            source: "google_sheets",
            sourceId: source.id,
            externalId,
            clientName: source.clientName ?? null,
            phoneNumber: phone ?? null,
            enquiryEntry: now,
            addedBy: `Google Sheet import`,
            status: sheetStatus ?? "NEW",
            requirements: name ?? null,
            data: row,
            log: `[${now}] Auto-synced from Google Sheet "${source.name}" row ${i + 2}`,
            ...(source.projectId && { projectId: source.projectId }),
          },
        });
        created++;
      }

      await prisma.leadSource.update({
        where: { id: source.id },
        data: { columns: data.headers, lastSyncedAt: new Date() },
      });

      totalCreated += created;
      totalSkipped += skipped;
    } catch (err) {
      errors.push(`${source.name}: ${err instanceof Error ? err.message : "unknown error"}`);
    }
  }

  return Response.json({
    synced: sources.length,
    created: totalCreated,
    skipped: totalSkipped,
    errors,
  });
}

function findField(row: Record<string, string>, candidates: string[]): string | null {
  for (const key of Object.keys(row)) {
    if (candidates.some((c) => key.toLowerCase().includes(c))) {
      return row[key] || null;
    }
  }
  return null;
}

const VALID_STATUSES = ["NEW","ATTENDED","NO_RESPONSE","CALL_BACK","INTERESTED","FOLLOW_UP","VISITING_STORE","WON","LOST"];
const STATUS_ALIASES: Record<string, string> = {
  "new": "NEW", "fresh": "NEW",
  "attended": "ATTENDED", "connected": "ATTENDED", "reached": "ATTENDED",
  "no response": "NO_RESPONSE", "no_response": "NO_RESPONSE", "not reachable": "NO_RESPONSE", "nr": "NO_RESPONSE",
  "call back": "CALL_BACK", "call_back": "CALL_BACK", "callback": "CALL_BACK", "cb": "CALL_BACK",
  "interested": "INTERESTED",
  "follow up": "FOLLOW_UP", "follow_up": "FOLLOW_UP", "followup": "FOLLOW_UP", "fu": "FOLLOW_UP",
  "visiting store": "VISITING_STORE", "visiting_store": "VISITING_STORE", "store visit": "VISITING_STORE",
  "won": "WON", "closed": "WON", "converted": "WON",
  "lost": "LOST", "not interested": "LOST", "not_interested": "LOST",
};

function normalizeStatus(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const val = raw.trim();
  if (VALID_STATUSES.includes(val.toUpperCase())) return val.toUpperCase();
  const alias = STATUS_ALIASES[val.toLowerCase()];
  if (alias) return alias;
  // Unknown status — store it as-is so it appears in the lead
  return val.toUpperCase();
}
