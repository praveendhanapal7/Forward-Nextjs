import { resolveUser, isAgency } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/integrations/meta — list registered Meta page sources
export async function GET() {
  try {
    const user = await resolveUser();
    if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

    const where = isAgency(user) ? { type: "meta" } : {
      type: "meta",
      clientName: user.brandName ?? undefined,
    };

    const sources = await prisma.leadSource.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return Response.json(sources);
  } catch {
    return Response.json({ message: "Something went wrong" }, { status: 500 });
  }
}

// POST /api/integrations/meta — register a Meta page for webhook
export async function POST(request: Request) {
  try {
    const user = await resolveUser();
    if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => null);
    const { pageId, name, clientName } = body ?? {};
    if (!pageId) return Response.json({ message: "pageId is required" }, { status: 400 });

    const resolvedClient = isAgency(user) ? (clientName ?? null) : (user.brandName ?? null);

    const source = await prisma.leadSource.create({
      data: {
        type: "meta",
        name: name ?? `Meta Page ${pageId}`,
        clientName: resolvedClient,
        config: { pageId },
      },
    });

    const webhookUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/webhooks/meta`;

    return Response.json(
      {
        source,
        setup: {
          webhookUrl,
          verifyToken: process.env.META_VERIFY_TOKEN ?? "(set META_VERIFY_TOKEN env var)",
          instructions: [
            "1. Go to Meta for Developers → Your App → Webhooks",
            "2. Subscribe to the 'Page' object",
            `3. Set callback URL: ${webhookUrl}`,
            "4. Set verify token to the value of META_VERIFY_TOKEN",
            "5. Subscribe to 'leadgen' field",
          ],
        },
      },
      { status: 201 },
    );
  } catch {
    return Response.json({ message: "Something went wrong" }, { status: 500 });
  }
}
