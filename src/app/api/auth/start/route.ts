import { NextResponse } from "next/server";
import { AUTH_RETURN_COOKIE, appOrigin, safeReturnPath } from "@/lib/auth";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = appOrigin(url.origin);
  const returnTo = safeReturnPath(url.searchParams.get("return"));

  const client = await createSupabaseRouteHandlerClient();
  if (!client) {
    return NextResponse.redirect(`${origin}/access-denied`, { status: 303 });
  }

  const { data, error } = await client.supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: origin,
      queryParams: { hd: "finalrev.com", prompt: "select_account" },
    },
  });

  if (error || !data.url) {
    return client.applyCookies(NextResponse.redirect(`${origin}/access-denied`, { status: 303 }));
  }

  const response = NextResponse.redirect(data.url);
  response.cookies.set(AUTH_RETURN_COOKIE, returnTo, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return client.applyCookies(response);
}
