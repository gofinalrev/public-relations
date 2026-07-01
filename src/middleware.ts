import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isAuthConfigured } from "@/lib/auth/allowed-email";
import { middlewareHandler, type PrHubSession } from "@/lib/auth/middleware-handler";

async function sessionFromRequest(req: NextRequest): Promise<PrHubSession> {
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });
  if (!token?.email) return null;
  return {
    user: {
      email: token.email as string,
      name: (token.name as string | null) ?? null,
      image: (token.picture as string | null) ?? null,
    },
    shopAdmin: Boolean(token.shopAdmin),
  };
}

export default async function middleware(req: NextRequest) {
  const session = isAuthConfigured() ? await sessionFromRequest(req) : null;
  return middlewareHandler(req, session);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
