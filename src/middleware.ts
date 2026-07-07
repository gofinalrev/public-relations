import { NextResponse, type NextRequest } from "next/server";
import { isAuthConfigured, isShopAdmin } from "@/lib/auth";
import { createSupabaseMiddlewareClient } from "@/lib/supabase";
import {
  clientIpFromHeaders,
  isNetworkOnlyMode,
  isPrivateOrLocalIp,
  isVercelDeployment,
} from "@/lib/network-access";

function notFound(req: NextRequest) {
  return NextResponse.rewrite(new URL("/not-found", req.url), { status: 404 });
}

function isPublic(pathname: string) {
  return pathname === "/sign-in" || pathname === "/access-denied" || pathname.startsWith("/api/auth/");
}

function cronOk(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  return secret && req.headers.get("authorization") === `Bearer ${secret}`;
}

function networkDenied(req: NextRequest, authOn: boolean) {
  if (!isNetworkOnlyMode() || authOn || isPublic(req.nextUrl.pathname)) return null;
  if (isVercelDeployment()) return notFound(req);
  const ip = clientIpFromHeaders(req.headers.get("x-forwarded-for"), req.headers.get("x-real-ip"));
  if (ip === "unknown" || isPrivateOrLocalIp(ip)) return null;
  return notFound(req);
}

async function refreshAuthSession(req: NextRequest) {
  const client = createSupabaseMiddlewareClient(req);
  if (!client) return { user: null, client: null as null };
  const {
    data: { user },
  } = await client.supabase.auth.getUser();
  return { user, client };
}

export default async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const authOn = isAuthConfigured();

  if (pathname.startsWith("/api/cron")) {
    if (cronOk(req)) return NextResponse.next();
    const { user, client } = await refreshAuthSession(req);
    if (client && isShopAdmin(user)) return client.response;
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const denied = networkDenied(req, authOn);
  if (denied) return denied;

  if (!authOn) {
    return process.env.NODE_ENV === "development" ? NextResponse.next() : notFound(req);
  }

  if (
    nextUrl.searchParams.has("error") &&
    pathname !== "/access-denied" &&
    !pathname.startsWith("/api/auth/")
  ) {
    const { client } = await refreshAuthSession(req);
    const redirect = NextResponse.redirect(new URL("/access-denied", nextUrl.origin));
    return client?.withResponse(redirect) ?? redirect;
  }

  if (nextUrl.searchParams.has("code") && pathname !== "/api/auth/callback") {
    const callback = nextUrl.clone();
    callback.pathname = "/api/auth/callback";
    return NextResponse.rewrite(callback);
  }

  const { user, client } = await refreshAuthSession(req);

  if (pathname.startsWith("/brand/")) {
    return client?.response ?? NextResponse.next();
  }

  if (isPublic(pathname)) {
    if (pathname === "/sign-in" && isShopAdmin(user)) {
      const redirect = NextResponse.redirect(new URL("/", nextUrl.origin));
      return client?.withResponse(redirect) ?? redirect;
    }
    return client?.response ?? NextResponse.next();
  }

  if (isShopAdmin(user)) {
    return client!.response;
  }

  if (user) {
    const redirect = NextResponse.redirect(new URL("/access-denied", nextUrl.origin));
    return client?.withResponse(redirect) ?? redirect;
  }

  const signIn = new URL("/sign-in", nextUrl.origin);
  signIn.searchParams.set("return", pathname + nextUrl.search);
  const redirect = NextResponse.redirect(signIn);
  return client?.withResponse(redirect) ?? redirect;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
