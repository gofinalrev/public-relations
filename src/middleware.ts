import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";
import { isAuthConfigured } from "@/lib/auth/allowed-email";
import {
  cronAuthorized,
  isPublicPath,
  networkOnlyGate,
} from "@/lib/auth/network-gate";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const authRequired = isAuthConfigured({ forEdge: true });

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
    if (req.auth?.user && pathname === "/login") {
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
