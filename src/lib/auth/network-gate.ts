import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  clientIpFromHeaders,
  isNetworkOnlyMode,
  isPrivateOrLocalIp,
  isVercelDeployment,
} from "@/lib/network-access";

export function networkOnlyGate(
  request: NextRequest,
  options?: { authEnabled?: boolean },
): NextResponse | null {
  if (!isNetworkOnlyMode()) {
    return null;
  }

  if (options?.authEnabled) {
    return null;
  }

  // Always allow sign-in routes — never block the login page behind network-only.
  if (isPublicPath(request.nextUrl.pathname)) {
    return null;
  }

  if (isVercelDeployment()) {
    return denyNetwork(request);
  }

  const ip = clientIpFromHeaders(
    request.headers.get("x-forwarded-for"),
    request.headers.get("x-real-ip"),
  );

  if (ip === "unknown" || isPrivateOrLocalIp(ip)) {
    return null;
  }

  return denyNetwork(request);
}

function denyNetwork(request: NextRequest): NextResponse {
  const acceptsHtml = request.headers.get("accept")?.includes("text/html");

  if (acceptsHtml) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.json(
    { error: "Forbidden", message: "Sign in required." },
    { status: 403 },
  );
}

export function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api/auth/")
  );
}

export function cronAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}
