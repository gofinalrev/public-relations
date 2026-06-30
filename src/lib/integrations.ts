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

export function getIntegrationWarnings(status: IntegrationStatus): IntegrationWarning[] {
  const warnings: IntegrationWarning[] = [];

  if (!status.hasPdfThisWeek) {
    warnings.push({
      id: "no-pdf",
      level: "warning",
      message: "No PDF this week. Social metrics empty until import.",
    });
  }

  if (!status.posthog) {
    warnings.push({
      id: "no-posthog",
      level: "warning",
      message: "PostHog key missing. Tooltrace funnel and finalREV uploads won't sync.",
    });
  } else if (!status.hasPostHogThisWeek) {
    warnings.push({
      id: "posthog-pending",
      level: "info",
      message: "PostHog syncs on page load.",
    });
  }

  if (!status.stripe) {
    warnings.push({
      id: "no-stripe",
      level: "warning",
      message: "Stripe off. Pro subs read 0. Get keys from Devon.",
    });
  }

  if (!status.youtube) {
    warnings.push({
      id: "no-youtube",
      level: "info",
      message: "YouTube API off. Update subs manually in goals.",
    });
  }

  return warnings;
}
