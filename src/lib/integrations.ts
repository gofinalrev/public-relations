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
export function getIntegrationWarnings(
  status: IntegrationStatus,
  metricQuality?: import("@/lib/metric-trust").ReportMetricQuality,
): IntegrationWarning[] {
  const warnings: IntegrationWarning[] = [];

  if (!status.hasPdfThisWeek) {
    warnings.push({
      id: "no-pdf",
      level: "warning",
      message: "No Metricool PDF for this period — social views and reach are empty until import.",
    });
  }

  if (status.posthog && !status.hasPostHogThisWeek) {
    warnings.push({
      id: "no-posthog-sync",
      level: "warning",
      message: "Tooltrace visitors not synced for this period yet.",
    });
  }

  if (metricQuality?.proSubsSource === "unconfigured") {
    warnings.push({
      id: "subs-unverified",
      level: "warning",
      message: "Pro subscriptions are not billing-verified. Connect Stripe before trusting sub counts.",
    });
  } else if (metricQuality?.proSubsSource === "posthog") {
    warnings.push({
      id: "subs-posthog",
      level: "info",
      message: "Pro subs from PostHog events, not Stripe billing. Directional only.",
    });
  }

  if (metricQuality?.funnelInferred) {
    warnings.push({
      id: "funnel-inferred",
      level: "info",
      message: "Funnel upload/generate steps are estimated. Download CAD is measured.",
    });
  }

  return warnings;
}
