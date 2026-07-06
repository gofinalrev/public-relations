import type { WeeklyReport } from "@/lib/db";
import type { DashboardPeriodContext } from "@/lib/period-context";
import { formatNumber } from "@/lib/utils";

export type ProSubsSource = "stripe" | "posthog" | "unconfigured";

export type ReportMetricQuality = {
  proSubsSource: ProSubsSource;
  subscriptionEventUsed: string | null;
  funnelInferred: boolean;
  hasMetricoolData: boolean;
  /** PostHog pull completed for this period (0 visitors is still valid). */
  posthogSynced: boolean;
  postHogConfigured: boolean;
  stripeConfigured: boolean;
};

export type ProSubsDisplay = {
  displayValue: string;
  sublabel: string;
  unavailable: boolean;
  showDelta: boolean;
};

type FunnelMeta = {
  subscriptionEventUsed?: string;
  funnelUsedInference?: boolean;
  analysis?: { conversionRate?: number | null; activationRate?: number | null };
};

export function parseFunnelMeta(report: WeeklyReport | null): FunnelMeta | null {
  if (!report?.posthog_funnel_json) return null;
  try {
    return JSON.parse(report.posthog_funnel_json) as FunnelMeta;
  } catch {
    return null;
  }
}

export function resolveProSubsDisplay(subs: number, quality: ReportMetricQuality): ProSubsDisplay {
  if (quality.proSubsSource === "stripe") {
    return {
      displayValue: formatNumber(subs),
      sublabel: "Tooltrace Pro · Stripe",
      unavailable: false,
      showDelta: true,
    };
  }
  if (quality.proSubsSource === "posthog" && subs > 0) {
    return {
      displayValue: formatNumber(subs),
      sublabel: "Tooltrace Pro · PostHog events (unverified)",
      unavailable: false,
      showDelta: true,
    };
  }
  if (quality.proSubsSource === "unconfigured") {
    return {
      displayValue: "—",
      sublabel: subs > 0 ? `PostHog logged ${subs} (not billing-verified)` : "Not tracked (Stripe not connected)",
      unavailable: true,
      showDelta: false,
    };
  }
  return {
    displayValue: formatNumber(subs),
    sublabel: "Tooltrace Pro",
    unavailable: false,
    showDelta: true,
  };
}

export function shouldShowConversionRate(quality: ReportMetricQuality): boolean {
  return quality.proSubsSource === "stripe";
}

export function shouldShowActivationRate(quality: ReportMetricQuality, funnel: FunnelMeta | null): boolean {
  if (quality.funnelInferred) return false;
  return funnel?.analysis?.activationRate != null;
}

export function getDataTrustWarnings(
  quality: ReportMetricQuality,
  context?: DashboardPeriodContext,
  options?: { includeGlobalConfig?: boolean; includeSocialPending?: boolean },
): string[] {
  const includeGlobal = options?.includeGlobalConfig ?? true;
  const includeSocial = options?.includeSocialPending ?? true;
  const warnings: string[] = [];

  if (includeSocial && !quality.hasMetricoolData) {
    warnings.push("Social views and reach import with the Metricool PDF.");
  }
  if (quality.postHogConfigured && !quality.posthogSynced) {
    warnings.push("Tooltrace visitors haven't been pulled from PostHog for this period yet.");
  }
  if (includeGlobal && !quality.postHogConfigured) {
    warnings.push("PostHog not configured — site metrics will be empty.");
  }
  if (includeGlobal && quality.proSubsSource === "unconfigured") {
    warnings.push("Pro subscriptions are not billing-verified. Connect Stripe before trusting sub counts.");
  } else if (quality.proSubsSource === "posthog") {
    warnings.push("Pro subs come from PostHog events, not Stripe billing. Treat as directional only.");
  }
  if (quality.funnelInferred) {
    warnings.push("Funnel upload/generate steps are estimated, not measured. Download CAD is the reliable step.");
  }
  if (context?.isMultiWeekReport) {
    warnings.push(`${context.periodDays}-day report — week-over-week % may not compare equal windows.`);
  }

  return warnings;
}
