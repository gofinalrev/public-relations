import { isSupabaseAuthConfigured } from "@/lib/supabase/env";

export function getAllowedEmailDomains(): string[] {
  const raw = process.env.AUTH_ALLOWED_DOMAINS?.trim() || "finalrev.com";
  return raw
    .split(/[,;]/)
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const lower = email.toLowerCase();
  const extra = (process.env.AUTH_ALLOW_EMAILS ?? "")
    .split(/[,;]/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (extra.includes(lower)) return true;
  return getAllowedEmailDomains().some((d) => lower.endsWith(`@${d}`));
}

/** Same Supabase Google OAuth as finalrev.com — no custom Google Cloud OAuth client. */
export function isAuthConfigured(): boolean {
  return isSupabaseAuthConfigured();
}

/** @deprecated use isAuthConfigured */
export function isGoogleAuthConfigured(): boolean {
  return isSupabaseAuthConfigured();
}
