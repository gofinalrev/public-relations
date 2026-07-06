const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

export function isAuthConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

export const AUTH_RETURN_COOKIE = "auth_return";

export function appOrigin(fallback?: string): string {
  return process.env.APP_PUBLIC_URL?.trim() || fallback || "https://pr.finalrev.com";
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
