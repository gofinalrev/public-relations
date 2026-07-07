import type { CookieOptions } from "@supabase/ssr";

/** Browser cookie lifetime — refresh tokens are renewed while this cookie exists. */
const DEFAULT_SESSION_DAYS = 400;

export function authSessionMaxAgeSeconds(): number {
  const raw = process.env.AUTH_SESSION_MAX_AGE_DAYS?.trim();
  const days = raw ? Number.parseInt(raw, 10) : DEFAULT_SESSION_DAYS;
  if (!Number.isFinite(days) || days < 1) return DEFAULT_SESSION_DAYS * 24 * 60 * 60;
  return days * 24 * 60 * 60;
}

export function supabaseCookieOptions(): CookieOptions {
  return {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: authSessionMaxAgeSeconds(),
  };
}

export type SessionCookie = {
  name: string;
  value: string;
  options?: CookieOptions;
};

export function applySessionCookies(target: NextResponseLike, cookies: SessionCookie[]): void {
  for (const { name, value, options } of cookies) {
    target.cookies.set(name, value, options);
  }
}

type NextResponseLike = {
  cookies: {
    set: (name: string, value: string, options?: CookieOptions) => void;
  };
};
