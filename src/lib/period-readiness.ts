import type { MetricoolPdfMeta, WeeklyReport } from "@/lib/db";
import type { ReportMetricQuality } from "@/lib/metric-trust";

export function periodHasReportData(args: {
  pdfMeta: MetricoolPdfMeta | null;
  metricQuality: ReportMetricQuality;
  postsLogged: number;
  metrics: { views: number; engagement: number; visitors: number; subs: number };
}): boolean {
  const { pdfMeta, metricQuality, postsLogged, metrics } = args;
  if (pdfMeta) return true;
  if (metricQuality.hasMetricoolData) return true;
  if (postsLogged > 0) return true;
  return (
    metrics.views > 0 ||
    metrics.engagement > 0 ||
    metrics.visitors > 0 ||
    metrics.subs > 0
  );
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
