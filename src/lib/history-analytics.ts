import type { WeeklyReport } from "@/lib/db";
import type { MetricoolWeeklyMetrics } from "@/lib/metricool/metrics";
import { formatWeekLabel, parseWeekKey } from "@/lib/weeks";
import { formatNumber } from "@/lib/utils";
import type { SocialPlatformSlug } from "@/lib/platforms";

export type FunnelRollup = {
  views: number;
  engagement: number;
  visitors: number;
  subs: number;
};

export type FunnelAverages = FunnelRollup;

export type HistoryAnalytics = {
  weeksRecorded: number;
  current: FunnelRollup;
  previous: FunnelRollup | null;
  trailing4Sum: FunnelRollup;
  trailing4Avg: FunnelAverages;
  trailing12Sum: FunnelRollup;
  trailing12Avg: FunnelAverages;
  bestWeek: { weekStart: string; label: string; views: number } | null;
  platformTotals: Partial<
    Record<SocialPlatformSlug, { videoViews: number; engagement: number; weeks: number }>
  >;
  momentum: {
    viewsVs4WeekAvg: number | null;
    visitorsVs4WeekAvg: number | null;
    subsVs4WeekAvg: number | null;
  };
};

function sumReports(reports: WeeklyReport[]): FunnelRollup {
  return reports.reduce(
    (acc, r) => ({
      views: acc.views + r.metricool_video_views,
      engagement: acc.engagement + r.metricool_engagement,
      visitors: acc.visitors + r.posthog_visitors,
      subs: acc.subs + r.posthog_subscriptions,
    }),
    { views: 0, engagement: 0, visitors: 0, subs: 0 },
  );
}

function avgFromSum(sum: FunnelRollup, count: number): FunnelAverages {
  if (count <= 0) return { views: 0, engagement: 0, visitors: 0, subs: 0 };
  return {
    views: sum.views / count,
    engagement: sum.engagement / count,
    visitors: sum.visitors / count,
    subs: sum.subs / count,
  };
}

function pctChange(current: number, baseline: number): number | null {
  if (baseline <= 0) return null;
  return ((current - baseline) / baseline) * 100;
}

function parsePlatformBreakdown(report: WeeklyReport): MetricoolWeeklyMetrics | null {
  if (!report.metricool_breakdown_json) return null;
  try {
    return JSON.parse(report.metricool_breakdown_json) as MetricoolWeeklyMetrics;
  } catch {
    return null;
  }
}

export function analyzeHistory(
  history: WeeklyReport[],
  currentWeekKey: string,
  previousReport: WeeklyReport | null,
): HistoryAnalytics {
  const sorted = [...history].sort((a, b) => a.week_start.localeCompare(b.week_start));
  const current = sorted.find((r) => r.week_start === currentWeekKey) ?? null;

  const currentRollup: FunnelRollup = current
    ? {
        views: current.metricool_video_views,
        engagement: current.metricool_engagement,
        visitors: current.posthog_visitors,
        subs: current.posthog_subscriptions,
      }
    : { views: 0, engagement: 0, visitors: 0, subs: 0 };

  const previousRollup: FunnelRollup | null = previousReport
    ? {
        views: previousReport.metricool_video_views,
        engagement: previousReport.metricool_engagement,
        visitors: previousReport.posthog_visitors,
        subs: previousReport.posthog_subscriptions,
      }
    : null;

  const priorWeeks = sorted.filter((r) => r.week_start < currentWeekKey);
  const trailing4 = priorWeeks.slice(-4);
  const trailing12 = priorWeeks.slice(-12);

  const trailing4Sum = sumReports(trailing4);
  const trailing12Sum = sumReports(trailing12);
  const trailing4Avg = avgFromSum(trailing4Sum, trailing4.length);
  const trailing12Avg = avgFromSum(trailing12Sum, trailing12.length);

  let bestWeek: HistoryAnalytics["bestWeek"] = null;
  for (const r of sorted) {
    if (!bestWeek || r.metricool_video_views > bestWeek.views) {
      bestWeek = {
        weekStart: r.week_start,
        label: formatWeekLabel(parseWeekKey(r.week_start)),
        views: r.metricool_video_views,
      };
    }
  }

  const platformTotals: HistoryAnalytics["platformTotals"] = {};
  for (const r of sorted) {
    const breakdown = parsePlatformBreakdown(r);
    if (!breakdown) continue;
    for (const p of breakdown.platforms) {
      const slug = p.platform as SocialPlatformSlug;
      const existing = platformTotals[slug] ?? { videoViews: 0, engagement: 0, weeks: 0 };
      platformTotals[slug] = {
        videoViews: existing.videoViews + p.videoViews,
        engagement: existing.engagement + p.engagement,
        weeks: existing.weeks + (p.videoViews > 0 || p.engagement > 0 ? 1 : 0),
      };
    }
  }

  return {
    weeksRecorded: sorted.length,
    current: currentRollup,
    previous: previousRollup,
    trailing4Sum,
    trailing4Avg,
    trailing12Sum,
    trailing12Avg,
    bestWeek,
    platformTotals,
    momentum: {
      viewsVs4WeekAvg: pctChange(currentRollup.views, trailing4Avg.views),
      visitorsVs4WeekAvg: pctChange(currentRollup.visitors, trailing4Avg.visitors),
      subsVs4WeekAvg: pctChange(currentRollup.subs, trailing4Avg.subs),
    },
  };
}

export function formatMomentum(pct: number | null): string {
  if (pct === null) return "—";
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(0)}% vs 4-wk avg`;
}

export function topPlatformByHistoricalViews(
  platformTotals: HistoryAnalytics["platformTotals"],
): { slug: SocialPlatformSlug; views: number } | null {
  let best: { slug: SocialPlatformSlug; views: number } | null = null;
  for (const [slug, stats] of Object.entries(platformTotals)) {
    if (!stats || stats.videoViews <= 0) continue;
    if (!best || stats.videoViews > best.views) {
      best = { slug: slug as SocialPlatformSlug, views: stats.videoViews };
    }
  }
  return best;
}

export function formatRollupLine(label: string, value: number, suffix = ""): string {
  return `${label}: ${formatNumber(value)}${suffix}`;
}
