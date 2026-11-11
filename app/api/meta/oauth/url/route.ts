import { resolveUser } from "@/lib/auth";

export async function GET() {
  const user = await resolveUser();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const appId = process.env.NEXT_PUBLIC_META_APP_ID ?? "";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const redirectUri = `${baseUrl}/api/meta/oauth/callback`;
  const scope = [
    "leads_retrieval",
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_ads",
    "ads_management",
    "business_management",
  ].join(",");

  const url = new URL("https://www.facebook.com/v19.0/dialog/oauth");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", scope);
  url.searchParams.set("response_type", "code");

  return Response.json({ url: url.toString() });
}
