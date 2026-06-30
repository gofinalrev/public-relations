import { isPostHogConfigured } from "@/lib/posthog/config";
import { isStripeConfigured, stripeConfigSource } from "@/lib/stripe/config";
import { isYouTubeConfigured } from "@/lib/social/youtube";
import { isMetricoolConfigured } from "@/lib/metricool/config";

export type IntegrationStatus = {
  posthog: boolean;
  stripe: boolean;
  stripeSource: ReturnType<typeof stripeConfigSource>;
  youtube: boolean;
  metricoolApi: boolean;
  hasPdfThisWeek: boolean;
  hasPostHogThisWeek: boolean;
};

export type IntegrationWarning = {
  id: string;
  level: "info" | "warning";
  message: string;
};

export function getIntegrationStatus(report: {
  metricool_synced_at?: string | null;
  posthog_synced_at?: string | null;
} | null): IntegrationStatus {
  return {
    posthog: isPostHogConfigured(),
    stripe: isStripeConfigured(),
    stripeSource: stripeConfigSource(),
    youtube: isYouTubeConfigured(),
    metricoolApi: isMetricoolConfigured(),
    hasPdfThisWeek: Boolean(report?.metricool_synced_at),
    hasPostHogThisWeek: Boolean(report?.posthog_synced_at),
  };
}

/** Ops/integration notes — log only, never render in the dashboard UI. */
export function getIntegrationOpsNotes(status: IntegrationStatus): string[] {
  const notes: string[] = [];

  if (!status.posthog) {
    notes.push(
      "PostHog key missing — Tooltrace funnel and finalREV uploads won't sync. Add POSTHOG_PERSONAL_API_KEY to .env.local.",
    );
  } else if (!status.hasPostHogThisWeek) {
    notes.push("PostHog sync runs on page load.");
  }

  if (!status.stripe) {
    notes.push(
      "Subs stay at 0 until STRIPE_SECRET_KEY and STRIPE_PRO_PRICE_ID are in .env.local. Slack tracks real subs separately.",
    );
  } else {
    notes.push(`Stripe connected (source: ${status.stripeSource}).`);
  }

  if (!status.youtube) {
    notes.push("YouTube API off — update YouTube subs manually in channel goals.");
  }

  if (!status.metricoolApi) {
    notes.push("Metricool API not configured — PDF import still works.");
  }

  return notes;
}

/** Executive-facing data gaps only — no env keys or integration setup hints. */
export function getIntegrationWarnings(status: IntegrationStatus): IntegrationWarning[] {
  const warnings: IntegrationWarning[] = [];

  if (!status.hasPdfThisWeek) {
    warnings.push({
      id: "no-pdf",
      level: "warning",
      message: "No PDF this week — social metrics are empty until import.",
    });
  }

  return warnings;
}
