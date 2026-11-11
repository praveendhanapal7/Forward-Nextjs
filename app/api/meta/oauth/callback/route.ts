import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}/dashboard/integrations?meta_error=1`);
  }

  const appId = process.env.NEXT_PUBLIC_META_APP_ID ?? "";
  const appSecret = process.env.META_APP_SECRET ?? "";
  const redirectUri = `${baseUrl}/api/meta/oauth/callback`;

  try {
    // Exchange code for short-lived token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`,
    );
    if (!tokenRes.ok) {
      const errBody = await tokenRes.json();
      console.error("[meta/oauth/callback] token exchange failed:", JSON.stringify(errBody));
      throw new Error("token exchange failed");
    }
    const { access_token: shortToken } = await tokenRes.json();

    // Exchange for long-lived user token
    const llRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortToken}`,
    );
    if (!llRes.ok) throw new Error("long-lived token exchange failed");
    const { access_token: longToken } = await llRes.json();

    const response = NextResponse.redirect(`${baseUrl}/dashboard/integrations?meta_connected=1`);
    response.cookies.set("meta_setup_token", longToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.redirect(`${baseUrl}/dashboard/integrations?meta_error=1`);
  }
}
