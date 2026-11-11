import { resolveUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  const user = await resolveUser();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const integrations = await prisma.metaIntegration.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      clientName: true,
      pageId: true,
      pageName: true,
      formId: true,
      formName: true,
      status: true,
      projectId: true,
      project: { select: { id: true, name: true } },
      createdAt: true,
      createdBy: true,
      _count: { select: { logs: true } },
    },
  });

  return Response.json(integrations);
}

async function getPageAccessToken(userToken: string, pageId: string): Promise<string | null> {
  // 1. Personal pages
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${userToken}&fields=id,access_token&limit=200`,
    );
    if (res.ok) {
      const data = await res.json();
      const page = (data.data ?? []).find((p: { id: string }) => p.id === pageId);
      if (page?.access_token) return page.access_token;
    }
  } catch { /* fall through */ }

  // 2. Business Manager pages
  try {
    const bizRes = await fetch(
      `https://graph.facebook.com/v19.0/me/businesses?access_token=${userToken}&fields=id&limit=50`,
    );
    if (bizRes.ok) {
      const bizData = await bizRes.json();
      for (const biz of bizData.data ?? []) {
        for (const endpoint of ["owned_pages", "client_pages", "agency_pages"]) {
          try {
            const r = await fetch(
              `https://graph.facebook.com/v19.0/${biz.id}/${endpoint}?access_token=${userToken}&fields=id,access_token&limit=200`,
            );
            if (r.ok) {
              const d = await r.json();
              const page = (d.data ?? []).find((p: { id: string }) => p.id === pageId);
              if (page?.access_token) return page.access_token;
            }
          } catch { /* best-effort */ }
        }
      }
    }
  } catch { /* fall through */ }

  return null;
}

export async function POST(request: Request) {
  const user = await resolveUser();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const { name, pageId, pageName, formId, formName, projectId, clientName } = body ?? {};

  if (!pageId || !formId) {
    return Response.json({ message: "pageId and formId are required" }, { status: 400 });
  }

  // Get page access token from the OAuth cookie
  const cookieStore = await cookies();
  const userToken = cookieStore.get("meta_setup_token")?.value;
  if (!userToken) {
    return Response.json({ message: "Session expired. Please connect with Facebook again." }, { status: 400 });
  }

  const pageAccessToken = await getPageAccessToken(userToken, pageId);
  if (!pageAccessToken) {
    return Response.json({ message: "Page not found in your account" }, { status: 404 });
  }

  // Subscribe the page to our webhook for leadgen events
  try {
    await fetch(
      `https://graph.facebook.com/v19.0/${pageId}/subscribed_apps?subscribed_fields=leadgen&access_token=${pageAccessToken}`,
      { method: "POST" },
    );
    await fetch(
      `https://graph.facebook.com/v19.0/me/subscribed_apps?subscribed_fields=leadgen&access_token=${userToken}`,
      { method: "POST" },
    );
  } catch {
    // Best-effort — continue even if subscription call fails
  }

  const resolvedClientName = clientName?.trim() || null;

  const integration = await prisma.metaIntegration.upsert({
    where: { formId },
    create: {
      name: name || `${pageName || pageId} — ${formName || formId}`,
      clientName: resolvedClientName,
      pageId,
      pageName: pageName || pageId,
      formId,
      formName: formName || formId,
      pageAccessToken,
      status: "active",
      createdBy: user.email,
      ...(projectId && { projectId }),
    },
    update: {
      name: name || `${pageName || pageId} — ${formName || formId}`,
      clientName: resolvedClientName,
      pageName: pageName || pageId,
      formName: formName || formId,
      pageAccessToken,
      status: "active",
      ...(projectId && { projectId }),
    },
  });

  return Response.json(integration, { status: 201 });
}
