import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAuthConfigured } from "@/lib/auth/allowed-email";
import { cronAuthorized, isPublicPath, networkOnlyGate } from "@/lib/auth/network-gate";
import { stealthNotFound } from "@/lib/auth/stealth-response";

function hasAccess(session: { shopAdmin?: boolean } | null | undefined): boolean {
  return Boolean(session?.shopAdmin);
}

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const authOn = isAuthConfigured();

  if (pathname.startsWith("/api/cron")) {
    if (cronAuthorized(req)) return NextResponse.next();
    if (authOn && hasAccess(req.auth)) return NextResponse.next();
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const denied = networkOnlyGate(req, { authEnabled: authOn });
  if (denied) return denied;

  if (!authOn) {
    return process.env.NODE_ENV === "development" ? NextResponse.next() : stealthNotFound(req);
  }

  if (isPublicPath(pathname)) {
    if (hasAccess(req.auth) && pathname === "/sign-in") {
      return NextResponse.redirect(new URL("/", nextUrl.origin));
    }
    return NextResponse.next();
  }

  if (!hasAccess(req.auth)) {
    if (pathname === "/access-denied") return NextResponse.next();
    return NextResponse.redirect(new URL("/sign-in", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
