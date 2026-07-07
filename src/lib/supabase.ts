import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfig } from "@/lib/auth";
import { applySessionCookies, supabaseCookieOptions, type SessionCookie } from "@/lib/supabase-session";

type CookieToSet = SessionCookie;

function serverClientOptions(cookieHandlers: {
  getAll: () => { name: string; value: string }[];
  setAll: (toSet: CookieToSet[]) => void;
}) {
  const cfg = supabaseConfig();
  if (!cfg) return null;
  return {
    url: cfg.url,
    key: cfg.key,
    cookieHandlers,
  };
}

export async function createSupabaseRouteHandlerClient() {
  const cookieStore = await cookies();
  let pending: CookieToSet[] = [];

  const cfg = serverClientOptions({
    getAll: () => cookieStore.getAll(),
    setAll: (toSet) => {
      pending = toSet;
      try {
        toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      } catch {
        /* route handler redirect */
      }
    },
  });
  if (!cfg) return null;

  const supabase = createServerClient(cfg.url, cfg.key, {
    cookieOptions: supabaseCookieOptions(),
    cookies: cfg.cookieHandlers,
  });

  return {
    supabase,
    applyCookies(response: NextResponse) {
      applySessionCookies(response, pending);
      return response;
    },
  };
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const cfg = serverClientOptions({
    getAll: () => cookieStore.getAll(),
    setAll: (toSet) => {
      try {
        toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      } catch {
        /* refreshed in middleware */
      }
    },
  });
  if (!cfg) throw new Error("Supabase not configured");

  return createServerClient(cfg.url, cfg.key, {
    cookieOptions: supabaseCookieOptions(),
    cookies: cfg.cookieHandlers,
  });
}

export function createSupabaseMiddlewareClient(request: NextRequest) {
  const cfg = supabaseConfig();
  if (!cfg) return null;

  let response = NextResponse.next({ request });
  let sessionCookies: CookieToSet[] = [];

  const supabase = createServerClient(cfg.url, cfg.key, {
    cookieOptions: supabaseCookieOptions(),
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        sessionCookies = toSet;
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        applySessionCookies(response, toSet);
      },
    },
  });

  return {
    supabase,
    response,
    withResponse(next: NextResponse) {
      applySessionCookies(next, sessionCookies);
      return next;
    },
  };
}
