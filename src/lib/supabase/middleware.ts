import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAllowedEmail } from "@/lib/auth/allowed-email";
import {
  cronAuthorized,
  isPublicPath,
  networkOnlyGate,
} from "@/lib/auth/network-gate";
import { getSupabasePublishableKey, getSupabaseUrl, isSupabaseAuthConfigured } from "@/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authRequired = isSupabaseAuthConfigured();

  if (pathname.startsWith("/api/cron")) {
    if (cronAuthorized(request)) return NextResponse.next();
    if (authRequired) {
      const user = await getRequestUser(request);
      if (user) return NextResponse.next();
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const denied = networkOnlyGate(request, { authEnabled: authRequired });
  if (denied) return denied;

  if (!authRequired) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && !isAllowedEmail(user.email)) {
    await supabase.auth.signOut();
    const login = new URL("/login", request.url);
    login.searchParams.set("error", "AccessDenied");
    return NextResponse.redirect(login);
  }

  if (isPublicPath(pathname)) {
    if (user && pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return response;
  }

  if (!user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", pathname + request.nextUrl.search);
    return NextResponse.redirect(login);
  }

  return response;
}

async function getRequestUser(request: NextRequest) {
  const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {},
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user && isAllowedEmail(user.email) ? user : null;
}
