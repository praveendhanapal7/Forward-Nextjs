import { resolveUser, isAgency } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchSheetRows } from "../../route";

export const maxDuration = 60;

// POST /api/integrations/sheets/[id]/sync — import / re-sync all rows from the sheet
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await resolveUser();
    if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const source = await prisma.leadSource.findUnique({ where: { id }, select: { id: true, name: true, clientName: true, config: true, projectId: true } });
    if (!source) return Response.json({ message: "Not found" }, { status: 404 });

    // Clients can only sync their own sources
    if (!isAgency(user) && source.clientName !== user.brandName) {
      return Response.json({ message: "Forbidden" }, { status: 403 });
    }

    const cfg = source.config as { spreadsheetId: string; gid?: string | null };
    const data = await fetchSheetRows(cfg.spreadsheetId, cfg.gid ?? null);
    if (!data) {
      return Response.json(
        { message: "Could not read the sheet. Check that it is still publicly shared." },
        { status: 422 },
      );
    }

    const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    let created = 0;
    let skipped = 0;

    // Build all externalIds for this source upfront, then fetch existing ones in one query
    const allExternalIds = data.rows.map((_, i) => `sheet_${source.id}_row_${i + 2}`);
    const existingLeads = await prisma.lead.findMany({
      where: { externalId: { in: allExternalIds } },
      select: { externalId: true, projectId: true, status: true, notes: true },
    });
    const existingMap = new Map(existingLeads.map((l) => [l.externalId, l]));

    const toCreate: Parameters<typeof prisma.lead.create>[0]["data"][] = [];

    for (let i = 0; i < data.rows.length; i++) {
      const row = data.rows[i];
      const externalId = `sheet_${source.id}_row_${i + 2}`; // row 1 = header

      const phone = findField(row, ["phone", "phone_number", "mobile", "contact"]);
      const name = findField(row, ["name", "full_name", "client_name", "customer"]);
      const sheetStatus = normalizeStatus(findField(row, ["status"]));
      const sheetNotes = findField(row, ["other details", "notes", "note", "remarks", "comment"]);

      const existing = existingMap.get(externalId);
      if (existing) {
        const updates: Record<string, unknown> = {};
        if (source.projectId && !existing.projectId) updates.projectId = source.projectId;
        if (sheetStatus && existing.status !== sheetStatus) updates.status = sheetStatus;
        if (sheetNotes && !existing.notes) updates.notes = sheetNotes;
        if (Object.keys(updates).length > 0) {
          await prisma.lead.update({ where: { externalId }, data: updates });
        }
        skipped++;
        continue;
      }

      toCreate.push({
        source: "google_sheets",
        sourceId: source.id,
        externalId,
        clientName: source.clientName ?? null,
        phoneNumber: phone ?? null,
        enquiryEntry: now,
        addedBy: `Google Sheet import`,
        status: sheetStatus ?? "NEW",
        requirements: name ?? null,
        notes: sheetNotes ?? null,
        data: row,
        log: `[${now}] Imported from Google Sheet "${source.name}" row ${i + 2}`,
        ...(source.projectId && { projectId: source.projectId }),
      });
    }

    // Batch insert all new leads in one query
    if (toCreate.length > 0) {
      await prisma.lead.createMany({ data: toCreate as never[], skipDuplicates: true });
      created = toCreate.length;
    }

    // Update source with latest columns + sync time
    await prisma.leadSource.update({
      where: { id: source.id },
      data: { columns: data.headers, lastSyncedAt: new Date() },
    });

    return Response.json({ created, skipped, total: data.rows.length });
  } catch {
    return Response.json({ message: "Something went wrong" }, { status: 500 });
  }
}

function findField(row: Record<string, string>, candidates: string[]): string | null {
  for (const key of Object.keys(row)) {
    if (candidates.some((c) => key.toLowerCase().includes(c))) {
      return row[key] || null;
    }
  }
  return null;
}

const VALID_STATUSES = ["NEW","ATTENDED","NO_RESPONSE","CALL_BACK","INTERESTED","FOLLOW_UP","VISITING_STORE","VISITED","WON","LOST"];
const STATUS_ALIASES: Record<string, string> = {
  "new": "NEW", "fresh": "NEW",
  "attended": "ATTENDED", "connected": "ATTENDED", "reached": "ATTENDED",
  "no response": "NO_RESPONSE", "no_response": "NO_RESPONSE", "not reachable": "NO_RESPONSE", "nr": "NO_RESPONSE",
  "call back": "CALL_BACK", "call_back": "CALL_BACK", "callback": "CALL_BACK", "cb": "CALL_BACK",
  "interested": "INTERESTED", "intrested": "INTERESTED",
  "follow up": "FOLLOW_UP", "follow_up": "FOLLOW_UP", "followup": "FOLLOW_UP", "fu": "FOLLOW_UP",
  "undecided": "FOLLOW_UP",
  "visiting store": "VISITING_STORE", "visiting_store": "VISITING_STORE", "store visit": "VISITING_STORE",
  "vising": "VISITING_STORE", "visiting": "VISITING_STORE",
  "visitor": "VISITED", "visited": "VISITED", "site visited": "VISITED",
  "won": "WON", "closed": "WON", "converted": "WON",
  "lost": "LOST", "not interested": "LOST", "not_interested": "LOST", "not intrested": "LOST",
  "not attended": "NO_RESPONSE", "not attented": "NO_RESPONSE", "not attained": "NO_RESPONSE",
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
