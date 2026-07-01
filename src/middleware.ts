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

function hasAccess(session: { shopAdmin?: boolean } | null | undefined): boolean {
  return Boolean(session?.shopAdmin);
}

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  if (pathname.startsWith("/api/cron")) {
    if (cronAuthorized(req)) return NextResponse.next();
    if (isAuthEnabled() && hasAccess(req.auth)) return NextResponse.next();
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const denied = networkOnlyGate(req, { authEnabled: isAuthEnabled() });
  if (denied) return denied;

  if (!isAuthEnabled()) {
    if (process.env.NODE_ENV === "development") {
      return NextResponse.next();
    }
    return stealthNotFound(req);
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (hasAccess(req.auth)) {
    return NextResponse.next();
  }

  // Signed in but not shop_admin — look like nothing is here
  if (req.auth?.user) {
    return stealthNotFound(req);
  }

  // Not signed in — one click through Google (same account as finalrev)
  const signIn = new URL("/api/auth/signin/google", nextUrl.origin);
  signIn.searchParams.set("callbackUrl", pathname + nextUrl.search);
  return NextResponse.redirect(signIn);
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
