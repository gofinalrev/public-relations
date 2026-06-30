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
    return hasSecret && hasClientId;
  }
  return Boolean(hasSecret && hasClientId && process.env.GOOGLE_CLIENT_SECRET?.trim());
}

/** Magic-link sign-in via Resend — no Google Cloud Console required. */
export function isEmailAuthConfigured(options?: { forEdge?: boolean }): boolean {
  const hasSecret = Boolean(process.env.AUTH_SECRET?.trim());
  const hasResend = Boolean(process.env.RESEND_API_KEY?.trim());
  if (options?.forEdge) {
    return hasSecret && hasResend;
  }
  return hasSecret && hasResend && Boolean(getAuthEmailFrom());
}

export function getAuthEmailFrom(): string {
  return (
    process.env.AUTH_EMAIL_FROM?.trim() ||
    process.env.WEEKLY_BRIEF_FROM?.trim() ||
    "finalREV PR <notifications@gofinalrev.com>"
  );
}

export function isAuthConfigured(options?: { forEdge?: boolean }): boolean {
  return isGoogleAuthConfigured(options) || isEmailAuthConfigured(options);
}
