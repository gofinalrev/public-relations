import { NextResponse } from "next/server";
import { AUTH_RETURN_COOKIE, appOrigin, safeReturnPath } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = appOrigin(url.origin);
  const returnTo = safeReturnPath(url.searchParams.get("return"));

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      // Exact URL — must match Supabase redirect allowlist (no query string).
      redirectTo: origin,
      queryParams: { hd: "finalrev.com", prompt: "select_account" },
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(`${origin}/access-denied`, { status: 303 });
  }

  const response = NextResponse.redirect(data.url);
  response.cookies.set(AUTH_RETURN_COOKIE, returnTo, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
