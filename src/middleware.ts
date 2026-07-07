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
  return pathname === "/access-denied" || pathname.startsWith("/api/auth/");
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

async function shopAdminSession(req: NextRequest) {
  const client = createSupabaseMiddlewareClient(req);
  if (!client) return null;
  const {
    data: { user },
  } = await client.supabase.auth.getUser();
  return isShopAdmin(user) ? client.response : null;
}

export default async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const authOn = isAuthConfigured();

  if (pathname.startsWith("/api/cron")) {
    if (cronOk(req)) return NextResponse.next();
    const session = await shopAdminSession(req);
    if (session) return session;
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
    return NextResponse.redirect(new URL("/access-denied", nextUrl.origin));
  }

  if (nextUrl.searchParams.has("code") && pathname !== "/api/auth/callback") {
    const callback = nextUrl.clone();
    callback.pathname = "/api/auth/callback";
    return NextResponse.rewrite(callback);
  }

  if (isPublic(pathname)) return NextResponse.next();

  const client = createSupabaseMiddlewareClient(req);
  if (client) {
    const {
      data: { user },
    } = await client.supabase.auth.getUser();
    if (isShopAdmin(user)) return client.response;
    if (user) {
      return NextResponse.redirect(new URL("/access-denied", nextUrl.origin));
    }
  }

  const start = new URL("/api/auth/start", nextUrl.origin);
  start.searchParams.set("return", pathname + nextUrl.search);
  return NextResponse.redirect(start);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
