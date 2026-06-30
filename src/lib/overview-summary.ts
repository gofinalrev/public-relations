import type { WeeklyReport, Channel, MetricoolPdfMeta } from "@/lib/db";
import type { DashboardPeriodContext } from "@/lib/period-context";
import { parseStoredInsights } from "@/lib/action-items";

export type OverviewEfficiency = {
  tooltraceConversionPct: number | null;
  socialToTooltraceRatio: number | null;
  tooltraceActivationPct: number | null;
};

export type OverviewMilestone = {
  label: string;
  value: string;
  detail?: string;
  product: "tooltrace" | "finalrev" | "social";
};

export type OverviewSummary = {
  headline: string | null;
  headlineType: "learning" | "success" | "warning" | "critical" | "info" | null;
  efficiency: OverviewEfficiency;
  tooltraceMilestones: OverviewMilestone[];
  finalrevMilestones: OverviewMilestone[];
  socialMilestones: OverviewMilestone[];
  topReferrer: { domain: string; visitors: number } | null;
  finalrevCadUploads: number | null;
};

function pickHeadline(report: WeeklyReport | null): Pick<OverviewSummary, "headline" | "headlineType"> {
  const learning = report?.learning?.trim();
  if (learning) {
    return { headline: learning, headlineType: "learning" };
  }

  const growth = parseStoredInsights(report?.growth_insights ?? "");
  const posthog = parseStoredInsights(report?.posthog_insights ?? "");
  const ranked = [...growth, ...posthog].filter((i) => i.type !== "info");
  const priority = ["success", "critical", "warning", "info"] as const;
  for (const type of priority) {
    const match = ranked.find((i) => i.type === type);
    if (match) {
      return { headline: match.body, headlineType: type };
    }
  }

  const info = growth[0] ?? posthog[0];
  if (info) {
    return { headline: info.body, headlineType: "info" };
  }

  return { headline: null, headlineType: null };
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

export function buildOverviewSummary(
  report: WeeklyReport | null,
  channels: Channel[],
  metrics: { views: number; visitors: number; subs: number },
): OverviewSummary {
  const { headline, headlineType } = pickHeadline(report);
  const funnel = parseFunnelAnalysis(report);
  const cadUploads = funnel?.finalrevCadUploads ?? null;

  const tooltraceConversionPct =
    funnel?.analysis?.conversionRate ??
    (metrics.visitors > 0 && metrics.subs > 0 ? (metrics.subs / metrics.visitors) * 100 : null);

  const socialToTooltraceRatio =
    metrics.views > 0 && metrics.visitors > 0 ? metrics.visitors / metrics.views : null;

  const tooltraceActivationPct = funnel?.analysis?.activationRate ?? null;

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
      value: metrics.subs.toLocaleString(),
      detail: "new subscriptions · this period",
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
    detail: "followers across active channels",
  });

  return {
    headline,
    headlineType,
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
