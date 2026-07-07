import type { MetricoolPdfMeta, WeeklyReport } from "@/lib/db";
import type { ReportMetricQuality } from "@/lib/metric-trust";

export function hasSocialMetrics(args: {
  pdfMeta: MetricoolPdfMeta | null;
  metricQuality: ReportMetricQuality;
  metrics: { views: number; engagement: number };
}): boolean {
  const { pdfMeta, metricQuality, metrics } = args;
  return (
    Boolean(pdfMeta) ||
    metricQuality.hasMetricoolData ||
    metrics.views > 0 ||
    metrics.engagement > 0
  );
}

export function hasLiveSiteMetrics(metricQuality: ReportMetricQuality): boolean {
  return metricQuality.posthogSynced;
}

export function periodHasReportData(args: {
  pdfMeta: MetricoolPdfMeta | null;
  metricQuality: ReportMetricQuality;
  postsLogged: number;
  metrics: { views: number; engagement: number; visitors: number; subs: number };
}): boolean {
  const { pdfMeta, metricQuality, postsLogged, metrics } = args;
  if (hasSocialMetrics({ pdfMeta, metricQuality, metrics })) return true;
  if (postsLogged > 0) return true;
  if (hasLiveSiteMetrics(metricQuality)) return true;
  return metrics.visitors > 0 || metrics.subs > 0;
}

export function metricHasPeriodValue(value: number, ready: boolean): boolean {
  return ready && value > 0;
}

export function hasFunnelDisplayData(report: WeeklyReport | null): boolean {
  if (!report?.posthog_funnel_json) return false;
  if (report.posthog_insights?.trim()) return true;
  try {
    const data = JSON.parse(report.posthog_funnel_json) as { topReferrers?: unknown[] };
    return (data.topReferrers?.length ?? 0) > 0;
  } catch {
    return false;
  }
}

export function findLatestReportedWeek(
  history: WeeklyReport[],
  currentWeekKey: string,
): WeeklyReport | null {
  const sorted = [...history].sort((a, b) => b.week_start.localeCompare(a.week_start));
  for (const row of sorted) {
    if (row.week_start === currentWeekKey) continue;
    if (
      row.metricool_synced_at ||
      row.metricool_video_views > 0 ||
      row.metricool_engagement > 0 ||
      row.posthog_visitors > 0
    ) {
      return row;
    }
  }
  return null;
}
