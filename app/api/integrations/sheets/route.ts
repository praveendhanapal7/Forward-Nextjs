import { resolveUser, isAgency } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function extractSheetId(url: string): { spreadsheetId: string; gid: string | null } | null {
  try {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (!match) return null;
    const gidMatch = url.match(/[#&?]gid=(\d+)/);
    return { spreadsheetId: match[1], gid: gidMatch?.[1] ?? null };
  } catch {
    return null;
  }
}

export async function fetchSheetRows(
  spreadsheetId: string,
  gid: string | null,
): Promise<{ headers: string[]; rows: Record<string, string>[] } | null> {
  const gidParam = gid ? `&gid=${gid}` : "";
  const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv${gidParam}`;
  try {
    const res = await fetch(csvUrl, { next: { revalidate: 0 } });
    if (!res.ok) return null;
    const text = await res.text();
    const lines = parseCSV(text);
    if (lines.length < 1) return null;
    const headers = lines[0];
    const rows = lines.slice(1).map((cols) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = cols[i] ?? "";
      });
      return obj;
    });
    return { headers, rows };
  } catch {
    return null;
  }
}

function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim()) continue;
    const cols: string[] = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuote) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') inQuote = false;
        else cur += ch;
      } else {
        if (ch === '"') inQuote = true;
        else if (ch === ",") { cols.push(cur); cur = ""; }
        else cur += ch;
      }
    }
    cols.push(cur);
    result.push(cols);
  }
  return result;
}

// GET /api/integrations/sheets — list connected sheets
export async function GET() {
  try {
    const user = await resolveUser();
    if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

    const where = isAgency(user) ? { type: "google_sheets" } : {
      type: "google_sheets",
      clientName: user.brandName ?? undefined,
    };

    const sources = await prisma.leadSource.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { project: { select: { id: true, name: true } } },
    });
    return Response.json(sources);
  } catch {
    return Response.json({ message: "Something went wrong" }, { status: 500 });
  }
}

// POST /api/integrations/sheets — connect a Google Sheet
export async function POST(request: Request) {
  try {
    const user = await resolveUser();
    if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => null);
    const { url, name, clientName, projectId } = body ?? {};
    if (!url) return Response.json({ message: "url is required" }, { status: 400 });

    const parsed = extractSheetId(url);
    if (!parsed) {
      return Response.json(
        { message: "Invalid Google Sheets URL. Share the sheet and paste its URL." },
        { status: 400 },
      );
    }

    // Test that the sheet is accessible
    const data = await fetchSheetRows(parsed.spreadsheetId, parsed.gid);
    if (!data) {
      return Response.json(
        {
          message:
            "Could not read the sheet. Make sure it is shared with 'Anyone with the link can view'.",
        },
        { status: 422 },
      );
    }

    const resolvedClient = isAgency(user)
      ? (clientName ?? null)
      : (user.brandName ?? null);

    const source = await prisma.leadSource.create({
      data: {
        type: "google_sheets",
        name: name ?? `Sheet – ${new Date().toLocaleDateString("en-IN")}`,
        clientName: resolvedClient,
        config: { spreadsheetId: parsed.spreadsheetId, gid: parsed.gid },
        columns: data.headers,
        ...(projectId && { projectId }),
      },
    });

    return Response.json({ source, preview: data.rows.slice(0, 3) }, { status: 201 });
  } catch {
    return Response.json({ message: "Something went wrong" }, { status: 500 });
  }
}
