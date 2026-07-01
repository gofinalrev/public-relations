import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { stealthNotFound } from "@/lib/auth/stealth-response";
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

  if (isPublicPath(request.nextUrl.pathname)) {
    return null;
  }

  if (isVercelDeployment()) {
    return stealthNotFound(request);
  }

  const ip = clientIpFromHeaders(
    request.headers.get("x-forwarded-for"),
    request.headers.get("x-real-ip"),
  );

  if (ip === "unknown" || isPrivateOrLocalIp(ip)) {
    return null;
  }

  return stealthNotFound(request);
}

export function isPublicPath(pathname: string): boolean {
  return pathname === "/sign-in" || pathname.startsWith("/api/auth/");
}

export function cronAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}
