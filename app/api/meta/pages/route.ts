import { resolveUser } from "@/lib/auth";
import { cookies } from "next/headers";

async function fetchAllPages(token: string) {
  const pages: { id: string; name: string; category?: string; access_token?: string }[] = [];
  const pageIds = new Set<string>();

  function addPages(arr: { id: string; name: string; category?: string; access_token?: string }[]) {
    for (const p of arr) {
      if (!pageIds.has(p.id)) {
        pages.push(p);
        pageIds.add(p.id);
      }
    }
  }

  // 1. Personal pages (direct admin)
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${token}&fields=id,name,category,access_token&limit=200`,
    );
    if (res.ok) {
      const data = await res.json();
      addPages(data.data ?? []);
    }
  } catch { /* best-effort */ }

  // 2. Business Manager pages
  try {
    const bizRes = await fetch(
      `https://graph.facebook.com/v19.0/me/businesses?access_token=${token}&fields=id,name&limit=50`,
    );
    if (bizRes.ok) {
      const bizData = await bizRes.json();
      for (const biz of bizData.data ?? []) {
        // 2a. Owned pages
        try {
          const r = await fetch(
            `https://graph.facebook.com/v19.0/${biz.id}/owned_pages?access_token=${token}&fields=id,name,category,access_token&limit=200`,
          );
          if (r.ok) addPages((await r.json()).data ?? []);
        } catch { /* best-effort */ }

        // 2b. Client pages
        try {
          const r = await fetch(
            `https://graph.facebook.com/v19.0/${biz.id}/client_pages?access_token=${token}&fields=id,name,category,access_token&limit=200`,
          );
          if (r.ok) addPages((await r.json()).data ?? []);
        } catch { /* best-effort */ }

        // 2c. Agency pages (pages managed for clients)
        try {
          const r = await fetch(
            `https://graph.facebook.com/v19.0/${biz.id}/agency_pages?access_token=${token}&fields=id,name,category,access_token&limit=200`,
          );
          if (r.ok) addPages((await r.json()).data ?? []);
        } catch { /* best-effort */ }
      }
    }
  } catch { /* best-effort */ }

  // 3. Pages the user is an admin of via page roles
  try {
    const r = await fetch(
      `https://graph.facebook.com/v19.0/me/pages?access_token=${token}&fields=id,name,category,access_token&limit=200`,
    );
    if (r.ok) addPages((await r.json()).data ?? []);
  } catch { /* best-effort */ }

  return pages;
}

export async function GET() {
  const user = await resolveUser();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const cookieStore = await cookies();
  const userToken = cookieStore.get("meta_setup_token")?.value;
  if (!userToken) {
    return Response.json(
      { message: "Connect with Facebook first to load your pages." },
      { status: 400 },
    );
  }

  const pages = await fetchAllPages(userToken);

  if (pages.length === 0) {
    return Response.json(
      { message: "No pages found. Make sure you are an admin of at least one Facebook Page." },
      { status: 404 },
    );
  }

  // Strip access_token from the response (kept server-side only)
  return Response.json(pages.map(({ access_token: _t, ...p }) => p));
}
