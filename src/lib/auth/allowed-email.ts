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

export function isGoogleAuthConfigured(options?: { forEdge?: boolean }): boolean {
  const hasSecret = Boolean(process.env.AUTH_SECRET?.trim());
  const hasClientId = Boolean(process.env.GOOGLE_CLIENT_ID?.trim());
  if (options?.forEdge) {
    // Edge middleware cannot access GOOGLE_CLIENT_SECRET on Vercel — ID + AUTH_SECRET is enough.
    return hasSecret && hasClientId;
  }
  return Boolean(hasSecret && hasClientId && process.env.GOOGLE_CLIENT_SECRET?.trim());
}

/** @deprecated use isGoogleAuthConfigured() */
export function isGoogleAuthConfiguredForMiddleware(): boolean {
  return isGoogleAuthConfigured({ forEdge: true });
}
