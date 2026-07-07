const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

export function isAuthConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

export const AUTH_RETURN_COOKIE = "auth_return";

const PR_HUB_DEFAULT = "https://pr.finalrev.com";

function normalizeOrigin(value: string | undefined): string | undefined {
  const trimmed = value?.trim().replace(/\/$/, "");
  return trimmed || undefined;
}

/** True when the host is this app (PR hub), not the main marketing site. */
export function isPrHubOrigin(origin: string): boolean {
  try {
    const host = new URL(origin).hostname.toLowerCase();
    if (host === "pr.finalrev.com") return true;
    if (host === "localhost" || host === "127.0.0.1") return true;
    if (host.endsWith(".vercel.app")) return true;
    return false;
  } catch {
    return false;
  }
}

/** Canonical origin for OAuth redirects and post-login URLs. Prefers the PR hub request host over APP_PUBLIC_URL. */
export function appOrigin(requestOrigin?: string): string {
  const req = normalizeOrigin(requestOrigin);
  if (req && isPrHubOrigin(req)) return req;

  const env = normalizeOrigin(process.env.APP_PUBLIC_URL);
  if (env && isPrHubOrigin(env)) return env;

  return req || env || PR_HUB_DEFAULT;
}

export function safeReturnPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const lower = email.toLowerCase();
  const domains = (process.env.AUTH_ALLOWED_DOMAINS?.trim() || "finalrev.com")
    .split(/[,;]/)
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  const extra = (process.env.AUTH_ALLOW_EMAILS ?? "")
    .split(/[,;]/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return extra.includes(lower) || domains.some((d) => lower.endsWith(`@${d}`));
}

export function isShopAdmin(user: { email?: string | null; app_metadata?: Record<string, unknown> } | null | undefined): boolean {
  if (!user?.email || !isAllowedEmail(user.email)) return false;
  return user.app_metadata?.user_role === "shop_admin";
}

export function supabaseConfig() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  return { url: SUPABASE_URL, key: SUPABASE_KEY };
}
