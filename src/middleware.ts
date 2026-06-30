import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";
import {
  cronAuthorized,
  isPublicPath,
  networkOnlyGate,
} from "@/lib/auth/network-gate";
import { NextResponse } from "next/server";

const { auth } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
});

/**
 * Next.js inlines env vars referenced in this file at build time.
 * VERCEL is always set on deploy — use it so production always requires sign-in.
 */
function shouldRequireAuth(): boolean {
  if (process.env.VERCEL === "1") {
    return true;
  }
  return Boolean(
    process.env.AUTH_SECRET?.trim() && process.env.GOOGLE_CLIENT_ID?.trim(),
  );
}

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const authRequired = shouldRequireAuth();

  if (pathname.startsWith("/api/cron")) {
    if (cronAuthorized(req)) return NextResponse.next();
    if (authRequired && req.auth) return NextResponse.next();
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const denied = networkOnlyGate(req, { authEnabled: authRequired });
  if (denied) return denied;

  if (!authRequired) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    if (req.auth && pathname === "/login") {
      return NextResponse.redirect(new URL("/", nextUrl.origin));
    }
    return NextResponse.next();
  }

  if (!req.auth?.user) {
    const login = new URL("/login", nextUrl.origin);
    login.searchParams.set("callbackUrl", pathname + nextUrl.search);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
