import { NextResponse, type NextRequest } from "next/server";
import { AUTH_RETURN_COOKIE, isShopAdmin, safeReturnPath } from "@/lib/auth";
import { createSupabaseMiddlewareClient } from "@/lib/supabase";

function redirectWithCookies(target: URL, sessionResponse: NextResponse): NextResponse {
  const redirect = NextResponse.redirect(target);
  sessionResponse.cookies.getAll().forEach(({ name, value }) => {
    redirect.cookies.set(name, value);
  });
  redirect.cookies.delete(AUTH_RETURN_COOKIE);
  return redirect;
}

export async function handleOAuthReturn(req: NextRequest): Promise<NextResponse | null> {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return null;

  const client = createSupabaseMiddlewareClient(req);
  if (!client) return null;

  const denied = new URL("/access-denied", req.nextUrl.origin);

  const { error } = await client.supabase.auth.exchangeCodeForSession(code);
  if (error) return redirectWithCookies(denied, client.response);

  const {
    data: { user },
  } = await client.supabase.auth.getUser();
  if (!isShopAdmin(user)) {
    await client.supabase.auth.signOut();
    return redirectWithCookies(denied, client.response);
  }

  const returnPath = safeReturnPath(
    req.cookies.get(AUTH_RETURN_COOKIE)?.value ?? req.nextUrl.searchParams.get("next"),
  );
  return redirectWithCookies(new URL(returnPath, req.nextUrl.origin), client.response);
}
