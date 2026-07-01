import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stealthNotFound } from "@/lib/auth/stealth-response";
import {
  cronAuthorized,
  isPublicPath,
  networkOnlyGate,
} from "@/lib/auth/network-gate";

function isAuthEnabled(): boolean {
  return Boolean(process.env.AUTH_SECRET?.trim() && process.env.GOOGLE_CLIENT_ID?.trim());
}

function sessionHasPrAccess(session: { shopAdmin?: boolean } | null | undefined): boolean {
  return Boolean(session?.shopAdmin);
}

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const authRequired = isAuthEnabled();

  if (pathname.startsWith("/api/cron")) {
    if (cronAuthorized(req)) return NextResponse.next();
    if (authRequired && sessionHasPrAccess(req.auth)) return NextResponse.next();
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const denied = networkOnlyGate(req, { authEnabled: authRequired });
  if (denied) return denied;

  if (!authRequired) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    if (sessionHasPrAccess(req.auth) && pathname === "/sign-in") {
      return NextResponse.redirect(new URL("/", nextUrl.origin));
    }
    return NextResponse.next();
  }

  if (!sessionHasPrAccess(req.auth)) {
    return stealthNotFound(req);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
