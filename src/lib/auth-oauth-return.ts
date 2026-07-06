import { NextResponse, type NextRequest } from "next/server";
import { isShopAdmin } from "@/lib/auth";
import { createSupabaseMiddlewareClient } from "@/lib/supabase";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

function redirectWithCookies(target: URL, sessionResponse: NextResponse): NextResponse {
  const redirect = NextResponse.redirect(target);
  sessionResponse.cookies.getAll().forEach(({ name, value }) => {
    redirect.cookies.set(name, value);
  });
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

  return redirectWithCookies(
    new URL(safeNextPath(req.nextUrl.searchParams.get("next")), req.nextUrl.origin),
    client.response,
  );
}
