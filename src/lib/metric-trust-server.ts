import type { WeeklyReport } from "@/lib/db";
import { isPostHogConfigured } from "@/lib/posthog/config";
import { isStripeConfigured } from "@/lib/stripe/config";
import { isStripeSubsUnconfigured } from "@/lib/ops-log";
import {
  parseFunnelMeta,
  type ProSubsSource,
  type ReportMetricQuality,
} from "@/lib/metric-trust";

export function resolveProSubsSource(subscriptionEventUsed?: string | null): ProSubsSource {
  if (!subscriptionEventUsed) {
    return isStripeConfigured() ? "stripe" : "unconfigured";
  }
  if (isStripeSubsUnconfigured(subscriptionEventUsed)) return "unconfigured";
  if (subscriptionEventUsed.startsWith("stripe:")) return "stripe";
  return "posthog";
}

export function buildReportMetricQuality(report: WeeklyReport | null): ReportMetricQuality {
  const funnel = parseFunnelMeta(report);
  const subscriptionEventUsed = funnel?.subscriptionEventUsed ?? null;

  return {
    proSubsSource: resolveProSubsSource(subscriptionEventUsed),
    subscriptionEventUsed,
    funnelInferred: Boolean(funnel?.funnelUsedInference),
    hasMetricoolData: Boolean(
      report?.metricool_synced_at && (report.metricool_video_views > 0 || report.metricool_engagement > 0),
    ),
    hasPostHogData: Boolean(report?.posthog_synced_at && report.posthog_visitors > 0),
    postHogConfigured: isPostHogConfigured(),
    stripeConfigured: isStripeConfigured(),
  };
}
