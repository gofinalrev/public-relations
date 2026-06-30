/** Internal ops / integration notes — console only, never shown to executives. */

const OPS_PATTERNS: RegExp[] = [
  /\.env\.local/i,
  /\bSTRIPE_/i,
  /\bPOSTHOG_/i,
  /\bMETRICOOL_/i,
  /\bGOOGLE_GENERATIVE_AI_API_KEY/i,
  /\bGEMINI_API_KEY/i,
  /\bRESEND_API_KEY/i,
  /not configured/i,
  /stripe:not_configured/i,
  /posthog:subscription/i,
  /PostHog key missing/i,
  /PostHog syncs on page/i,
  /PostHog sync runs/i,
  /YouTube API off/i,
  /YouTube API or/i,
  /Get keys from/i,
  /Slack tracks/i,
  /Pro subs not connected/i,
  /inferred from downloads/i,
  /POSTHOG_TOOLTRACE_PROJECT_ID/i,
  /subscription_success pageview/i,
  /Stripe off/i,
  /Stripe \/ PostHog/i,
  /cad_upload \(209711\)/i,
  /Reddit API/i,
  /Metricool API/i,
  /\bnpm run\b/i,
  /\bffmpeg\b/i,
  /ffmpeg-static/i,
  /team:serve/i,
  /GOOGLE_GENERATIVE_AI/i,
  /Gemini not configured/i,
  /Transcription is not available/i,
  /Shorts editor is not available/i,
];

export function isOpsMessage(text: string): boolean {
  const normalized = text.trim();
  if (!normalized) return false;
  return OPS_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function logOps(message: string, detail?: Record<string, unknown>): void {
  if (detail) {
    console.info(`[PR Hub · ops] ${message}`, detail);
  } else {
    console.info(`[PR Hub · ops] ${message}`);
  }
}

export function filterExecutiveInsights<T extends { title: string; body: string }>(insights: T[]): T[] {
  return insights.filter((insight) => !isOpsMessage(`${insight.title} ${insight.body}`));
}

export function isStripeSubsUnconfigured(subscriptionEventUsed?: string | null): boolean {
  if (!subscriptionEventUsed) return false;
  return (
    subscriptionEventUsed === "stripe:not_configured" ||
    subscriptionEventUsed.toLowerCase().includes("not configured")
  );
}

/** User-facing label for Pro subs metric — never expose env / integration strings. */
export function executiveSubsLabel(): string {
  return "Tooltrace Pro";
}

export function sanitizeExecutiveError(error: string, fallback = "Something went wrong. Try again."): string {
  if (isOpsMessage(error)) {
    logOps(error);
    return fallback;
  }
  return error;
}
