import { resolveUser } from "@/lib/auth";
import { cookies } from "next/headers";

async function getPageAccessToken(userToken: string, pageId: string): Promise<string | null> {
  // 1. Try personal accounts first
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

  // 2. Try Business Manager pages
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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const user = await resolveUser();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const { pageId } = await params;

  const cookieStore = await cookies();
  const userToken = cookieStore.get("meta_setup_token")?.value;
  if (!userToken) {
    return Response.json({ message: "Connect with Facebook first." }, { status: 400 });
  }

  const pageToken = await getPageAccessToken(userToken, pageId);
  const tokenToUse = pageToken ?? userToken;

  const formsRes = await fetch(
    `https://graph.facebook.com/v19.0/${pageId}/leadgen_forms?access_token=${tokenToUse}&fields=id,name,status,leads_count`,
  );

  if (!formsRes.ok) {
    const err = await formsRes.json();
    console.error("[meta/pages/forms] failed:", JSON.stringify(err));

    // If page token failed, try with user token as last resort
    if (pageToken) {
      const retryRes = await fetch(
        `https://graph.facebook.com/v19.0/${pageId}/leadgen_forms?access_token=${userToken}&fields=id,name,status,leads_count`,
      );
      if (retryRes.ok) {
        return Response.json((await retryRes.json()).data ?? []);
      }
      const retryErr = await retryRes.json();
      console.error("[meta/pages/forms] user token also failed:", JSON.stringify(retryErr));
      return Response.json(
        { message: retryErr.error?.message ?? "Failed to fetch forms" },
        { status: 400 },
      );
    }

    return Response.json(
      { message: err.error?.message ?? "Failed to fetch forms" },
      { status: 400 },
    );
  }

  return Response.json((await formsRes.json()).data ?? []);
}
