import { NextResponse, type NextRequest } from "next/server";

/** Bland 404 — no PR branding for unauthorized visitors. */
export function stealthNotFound(request: NextRequest): NextResponse {
  const url = new URL("/not-found", request.url);
  return NextResponse.rewrite(url, { status: 404 });
}
