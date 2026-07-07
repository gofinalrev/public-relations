import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_RETURN_COOKIE, appOrigin, isShopAdmin, safeReturnPath } from "@/lib/auth";
import { PR_OAUTH_BRIDGE_COOKIE, prOAuthBridgeCookieOptions } from "@/lib/auth/pr-oauth-bridge";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase";

export async function handleOAuthCallback(request: Request) {
  const url = new URL(request.url);
  const origin = appOrigin(url.origin);
  const fail = () => NextResponse.redirect(`${origin}/access-denied`, { status: 303 });

  const client = await createSupabaseRouteHandlerClient();
  if (!client) return fail();

  const code = url.searchParams.get("code");
  if (code) {
    const { error } = await client.supabase.auth.exchangeCodeForSession(code);
    if (error) return client.applyCookies(fail());
  }

  const {
    data: { user },
  } = await client.supabase.auth.getUser();
  if (!isShopAdmin(user)) {
    await client.supabase.auth.signOut();
    return client.applyCookies(fail());
  }

  const cookieStore = await cookies();
  const returnPath = safeReturnPath(
    cookieStore.get(AUTH_RETURN_COOKIE)?.value ?? url.searchParams.get("next"),
  );

  const response = NextResponse.redirect(`${origin}${returnPath}`, { status: 303 });
  response.cookies.delete(AUTH_RETURN_COOKIE);
  response.cookies.set(PR_OAUTH_BRIDGE_COOKIE, "", { ...prOAuthBridgeCookieOptions(0), maxAge: 0 });
  return client.applyCookies(response);
}
