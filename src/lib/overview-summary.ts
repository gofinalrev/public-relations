import type { WeeklyReport, Channel, MetricoolPdfMeta } from "@/lib/db";
import type { DashboardPeriodContext } from "@/lib/period-context";
import { parseStoredInsights } from "@/lib/action-items";
import { filterExecutiveInsights } from "@/lib/ops-log";
import { formatNumber } from "@/lib/utils";
import { buildReportMetricQuality } from "@/lib/metric-trust-server";
import {
  shouldShowConversionRate,
  type ReportMetricQuality,
} from "@/lib/metric-trust";

export type SummaryProduct = "social" | "tooltrace" | "finalrev";

export type SummaryLine = {
  product: SummaryProduct;
  text: string;
};

export type OverviewEfficiency = {
  tooltraceConversionPct: number | null;
  socialToTooltraceRatio: number | null;
  tooltraceActivationPct: number | null;
};

export type OverviewMilestone = {
  label: string;
  value: string;
  detail?: string;
  product: SummaryProduct;
};

export type OverviewSummary = {
  summaryLines: SummaryLine[];
  teamNote: string | null;
  headlineType: "learning" | "success" | "warning" | "critical" | "info" | null;
  efficiency: OverviewEfficiency;
  tooltraceMilestones: OverviewMilestone[];
  finalrevMilestones: OverviewMilestone[];
  socialMilestones: OverviewMilestone[];
  topReferrer: { domain: string; visitors: number } | null;
  finalrevCadUploads: number | null;
};

const PRODUCT_LABELS: Record<SummaryProduct, string> = {
  social: "Social",
  tooltrace: "Tooltrace",
  finalrev: "finalREV",
};

export function summaryProductLabel(product: SummaryProduct): string {
  return PRODUCT_LABELS[product];
}

function cleanReferrerDomain(domain: string): string {
  return domain
    .replace(/^\$/, "")
    .replace(/^www\./i, "")
    .toLowerCase();
}

function periodDeltaPhrase(current: number, previous: number | null | undefined): string | null {
  if (previous === null || previous === undefined) return null;
  const delta = current - previous;
  if (delta === 0) return null;
  return `${delta > 0 ? "up" : "down"} ${formatNumber(Math.abs(delta))} vs last period`;
}

function pickHeadlineType(report: WeeklyReport | null): OverviewSummary["headlineType"] {
  const growth = filterExecutiveInsights(parseStoredInsights(report?.growth_insights ?? ""));
  const posthog = filterExecutiveInsights(parseStoredInsights(report?.posthog_insights ?? ""));
  const ranked = [...growth, ...posthog].filter((i) => i.type !== "info");
  const priority = ["critical", "warning", "success", "info"] as const;
  for (const type of priority) {
    if (ranked.some((i) => i.type === type)) return type;
  }
  if (report?.learning?.trim()) return "learning";
  return ranked[0]?.type as OverviewSummary["headlineType"] ?? null;
}

function parseFunnelAnalysis(report: WeeklyReport | null) {
  if (!report?.posthog_funnel_json) return null;
  try {
    return JSON.parse(report.posthog_funnel_json) as {
      analysis?: { conversionRate?: number | null; activationRate?: number | null };
      topReferrers?: { domain: string; visitors: number }[];
      finalrevCadUploads?: number;
    };
  } catch {
    return null;
  }
}

function buildSummaryLines(
  metrics: { views: number; engagement: number; visitors: number; subs: number },
  prev: { views: number; engagement: number; visitors: number; subs: number } | null,
  funnel: ReturnType<typeof parseFunnelAnalysis>,
  quality: ReportMetricQuality,
): SummaryLine[] {
  const lines: SummaryLine[] = [];

  if (metrics.views > 0 || metrics.engagement > 0) {
    const socialParts: string[] = [];
    if (metrics.views > 0) {
      const viewsDelta = periodDeltaPhrase(metrics.views, prev?.views);
      socialParts.push(
        `${formatNumber(metrics.views)} video views${viewsDelta ? ` (${viewsDelta})` : ""}`,
      );
    }
    if (metrics.engagement > 0) {
      const engDelta = periodDeltaPhrase(metrics.engagement, prev?.engagement);
      socialParts.push(
        `${formatNumber(metrics.engagement)} reach + clicks (Metricool)${engDelta ? ` (${engDelta})` : ""}`,
      );
    }
    lines.push({
      product: "social",
      text: `${socialParts.join(" · ")} · Metricool / @gofinalrev`,
    });
  }

  const tooltraceLines: string[] = [];
  const topRef = funnel?.topReferrers?.[0];
  if (topRef && topRef.visitors > 0) {
    tooltraceLines.push(
      `Top referrer to tooltrace.ai: ${cleanReferrerDomain(topRef.domain)} (${formatNumber(topRef.visitors)} visitors)`,
    );
  }

  if (metrics.visitors > 0) {
    const visitorsDelta = periodDeltaPhrase(metrics.visitors, prev?.visitors);
    tooltraceLines.push(
      `${formatNumber(metrics.visitors)} unique visitors on tooltrace.ai${visitorsDelta ? ` (${visitorsDelta})` : ""}`,
    );
  }

  if (quality.proSubsSource === "stripe" && metrics.subs > 0) {
    const conversionRate =
      funnel?.analysis?.conversionRate ??
      (metrics.visitors > 0 ? (metrics.subs / metrics.visitors) * 100 : null);
    const conv =
      conversionRate !== null && Number.isFinite(conversionRate)
        ? ` · ${conversionRate.toFixed(1)}% visitor→Pro (Stripe)`
        : "";
    const subsDelta = periodDeltaPhrase(metrics.subs, prev?.subs);
    tooltraceLines.push(
      `${metrics.subs} new Tooltrace Pro sub${metrics.subs === 1 ? "" : "s"}${conv}${subsDelta ? ` (${subsDelta})` : ""}`,
    );
  } else if (quality.proSubsSource === "posthog" && metrics.subs > 0) {
    tooltraceLines.push(
      `${metrics.subs} Pro signup events in PostHog (unverified — connect Stripe for billing truth)`,
    );
  }

  for (const text of tooltraceLines) {
    lines.push({ product: "tooltrace", text });
  }

  const cadUploads = funnel?.finalrevCadUploads;
  if (cadUploads !== null && cadUploads !== undefined) {
    lines.push({
      product: "finalrev",
      text: `${formatNumber(cadUploads)} STEP upload${cadUploads === 1 ? "" : "s"} on finalrev.com (quote intent)`,
    });
  }

  return lines;
}

function isAutoGeneratedLearning(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("drove the most site traffic") ||
    lower.includes("vs last week") ||
    lower.includes("new pro sub") ||
    lower.includes("visitor→") ||
    (lower.includes("visitors") && lower.includes("conversion"))
  );
}

export function buildOverviewSummary(
  report: WeeklyReport | null,
  channels: Channel[],
  metrics: { views: number; engagement: number; visitors: number; subs: number },
  prev: { views: number; engagement: number; visitors: number; subs: number } | null = null,
): OverviewSummary {
  const funnel = parseFunnelAnalysis(report);
  const quality = buildReportMetricQuality(report);
  const cadUploads = funnel?.finalrevCadUploads ?? null;
  const summaryLines = buildSummaryLines(metrics, prev, funnel, quality);

  const learning = report?.learning?.trim() ?? "";
  const teamNote =
    learning && !isAutoGeneratedLearning(learning) ? learning : null;

  const tooltraceConversionPct =
    shouldShowConversionRate(quality) && metrics.subs > 0
      ? funnel?.analysis?.conversionRate ??
        (metrics.visitors > 0 ? (metrics.subs / metrics.visitors) * 100 : null)
      : null;

  const socialToTooltraceRatio =
    metrics.views > 0 && metrics.visitors > 0 ? metrics.visitors / metrics.views : null;

  const tooltraceActivationPct =
    quality.funnelInferred ? null : (funnel?.analysis?.activationRate ?? null);

  const youtube = channels.find((c) => c.slug === "youtube");
  const totalFollowers = channels
    .filter((c) => c.platform !== "web" && (c.status === "active" || c.status === "achieved"))
    .reduce((sum, c) => sum + c.current_value, 0);

  const tooltraceMilestones: OverviewMilestone[] = [
    {
      product: "tooltrace",
      label: "Tooltrace visitors",
      value: metrics.visitors.toLocaleString(),
      detail: "unique · tooltrace.ai",
    },
    {
      product: "tooltrace",
      label: "Tooltrace Pro subs",
      value: quality.proSubsSource === "unconfigured" ? "—" : metrics.subs.toLocaleString(),
      detail:
        quality.proSubsSource === "stripe"
          ? "Stripe · this period"
          : quality.proSubsSource === "posthog"
            ? "PostHog events · unverified"
            : "Not tracked",
    },
  ];

  const finalrevMilestones: OverviewMilestone[] = [
    {
      product: "finalrev",
      label: "STEP uploads",
      value: cadUploads !== null ? cadUploads.toLocaleString() : "—",
      detail: "finalrev.com · quote intent",
    },
  ];

  const socialMilestones: OverviewMilestone[] = [
    {
      product: "social",
      label: "Video views",
      value: metrics.views.toLocaleString(),
      detail: "Metricool · @gofinalrev",
    },
  ];

  if (youtube) {
    socialMilestones.push({
      product: "social",
      label: "YouTube subs",
      value: `${youtube.current_value.toLocaleString()} / ${youtube.goal_target.toLocaleString()}`,
      detail: "toward YouTube Partner Program",
    });
  }

  socialMilestones.push({
    product: "social",
    label: "Social audience",
    value: totalFollowers.toLocaleString(),
    detail: "Channel goals total — verify each platform",
  });

  return {
    summaryLines,
    teamNote,
    headlineType: pickHeadlineType(report),
    efficiency: {
      tooltraceConversionPct,
      socialToTooltraceRatio,
      tooltraceActivationPct,
    },
    tooltraceMilestones,
    finalrevMilestones,
    socialMilestones,
    topReferrer: funnel?.topReferrers?.[0] ?? null,
    finalrevCadUploads: cadUploads,
  };
}

export function formatEfficiencyPct(value: number | null, digits = 1): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

export function formatSocialToSiteRatio(ratio: number | null): string {
  if (ratio === null || !Number.isFinite(ratio)) return "—";
  if (ratio >= 10) return `${ratio.toFixed(0)}×`;
  return `${ratio.toFixed(1)}×`;
}

export function pdfViewUrl(weekStart: string) {
  return `/api/metricool/pdf?week=${encodeURIComponent(weekStart)}&disposition=inline`;
}

export function pdfDownloadUrl(weekStart: string) {
  return `/api/metricool/pdf?week=${encodeURIComponent(weekStart)}&disposition=attachment`;
}

export type OverviewViewProps = {
  weekStart: string;
  context: DashboardPeriodContext;
  pdfMeta: MetricoolPdfMeta | null;
  summary: OverviewSummary;
  metrics: { views: number; engagement: number; visitors: number; subs: number };
  prev: { views: number; engagement: number; visitors: number; subs: number } | null;
  history: WeeklyReport[];
  postHighlightsJson?: string | null;
};
