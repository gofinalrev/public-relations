import { NextResponse, type NextRequest } from "next/server";
import { stealthNotFound } from "@/lib/auth/stealth-response";
import {
  cronAuthorized,
  isPublicPath,
  networkOnlyGate,
} from "@/lib/auth/network-gate";

export type PrHubSession = {
  user?: { email?: string | null; name?: string | null; image?: string | null };
  shopAdmin?: boolean;
} | null;

export function middlewareHandler(req: NextRequest, session: PrHubSession): NextResponse {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const authOn = Boolean(
    process.env.AUTH_SECRET?.trim() &&
      process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim(),
  );

  if (pathname.startsWith("/api/cron")) {
    if (cronAuthorized(req)) return NextResponse.next();
    if (authOn && session?.shopAdmin) return NextResponse.next();
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const denied = networkOnlyGate(req, { authEnabled: authOn });
  if (denied) return denied;

  if (!authOn) {
    if (process.env.NODE_ENV === "development") return NextResponse.next();
    return stealthNotFound(req);
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (session?.shopAdmin) {
    return NextResponse.next();
  }

  if (session?.user) {
    return stealthNotFound(req);
  }

  const signIn = new URL("/api/auth/signin/google", nextUrl.origin);
  signIn.searchParams.set("callbackUrl", pathname + nextUrl.search);
  return NextResponse.redirect(signIn);
}
