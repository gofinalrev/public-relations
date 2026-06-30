import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  clientIpFromHeaders,
  isNetworkOnlyMode,
  isPrivateOrLocalIp,
  isVercelDeployment,
} from "@/lib/network-access";
import { isGoogleAuthConfigured } from "@/lib/auth/allowed-email";

export function networkOnlyGate(request: NextRequest): NextResponse | null {
  if (!isNetworkOnlyMode()) {
    return null;
  }

  if (isGoogleAuthConfigured()) {
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
    return new NextResponse(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Network only</title></head>
<body style="font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1.5rem;color:#27272a">
<h1>finalREV PR — network only</h1>
<p>Connect to office Wi‑Fi or sign in with Google once <code>GOOGLE_CLIENT_ID</code> is configured.</p>
</body></html>`,
      { status: 403, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  return NextResponse.json(
    { error: "Forbidden", message: "Network-only access, or configure Google sign-in." },
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
