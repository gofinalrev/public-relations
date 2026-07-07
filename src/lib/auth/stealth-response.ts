import { NextResponse, type NextRequest } from "next/server";

export function stealthNotFound(request: NextRequest): NextResponse {
  return NextResponse.rewrite(new URL("/not-found", request.url), { status: 404 });
}
