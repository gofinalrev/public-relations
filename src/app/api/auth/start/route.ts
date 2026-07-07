import { NextResponse } from "next/server";
import { AUTH_RETURN_COOKIE, oauthRedirectUrl, safeReturnPath } from "@/lib/auth";
import { PR_OAUTH_BRIDGE_COOKIE, prOAuthBridgeCookieOptions } from "@/lib/auth/pr-oauth-bridge";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirectTo = oauthRedirectUrl(url.origin);
  const returnTo = safeReturnPath(url.searchParams.get("return"));

  const client = await createSupabaseRouteHandlerClient();
  if (!client) {
    return NextResponse.redirect(`${redirectTo}/access-denied`, { status: 303 });
  }

  const { data, error } = await client.supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: { hd: "finalrev.com", prompt: "select_account" },
    },
  });

  if (error || !data.url) {
    return client.applyCookies(NextResponse.redirect(`${redirectTo}/access-denied`, { status: 303 }));
  }

  const response = NextResponse.redirect(data.url);
  response.cookies.set(AUTH_RETURN_COOKIE, returnTo, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  // If Supabase falls back to finalrev.com Site URL, finalrev middleware forwards ?code= here.
  response.cookies.set(PR_OAUTH_BRIDGE_COOKIE, "1", prOAuthBridgeCookieOptions());
  return client.applyCookies(response);
}
