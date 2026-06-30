import type { WeeklyReport } from "@/lib/db";
import { formatWeekLabel, getCurrentWeekKey, getWeekEnd, parseWeekKey } from "@/lib/weeks";
import { format } from "date-fns";

export type MetricScope = "period" | "cumulative" | "live";

export type PeriodScopeRow = {
  label: string;
  range: string;
  scope: MetricScope;
  detail: string;
};

export type DashboardPeriodContext = {
  weekKey: string;
  weekLabel: string;
  /** Human label for the social + site activity window */
  activityLabel: string;
  activityStart: string;
  activityEnd: string;
  periodDays: number;
  isMultiWeekReport: boolean;
  isCurrentCalendarWeek: boolean;
  hasSocialData: boolean;
  hasSiteData: boolean;
  comparisonLabel: string;
  showWeekOverWeek: boolean;
  rows: PeriodScopeRow[];
};

type BreakdownMeta = {
  periodLabel?: string;
  periodStart?: string;
  periodEnd?: string;
  periodDays?: number;
  source?: string;
};

function parseBreakdown(report: WeeklyReport | null): BreakdownMeta {
  if (!report?.metricool_breakdown_json) return {};
  try {
    return JSON.parse(report.metricool_breakdown_json) as BreakdownMeta;
  } catch {
    return {};
  }
}

function parsePostHogPeriod(report: WeeklyReport | null): { start?: string; end?: string } {
  if (!report?.posthog_funnel_json) return {};
  try {
    const data = JSON.parse(report.posthog_funnel_json) as { periodStart?: string; periodEnd?: string };
    return { start: data.periodStart, end: data.periodEnd };
  } catch {
    return {};
  }
}

export function buildDashboardPeriodContext(
  weekStart: string,
  report: WeeklyReport | null,
): DashboardPeriodContext {
  const breakdown = parseBreakdown(report);
  const posthogPeriod = parsePostHogPeriod(report);
  const weekStartDate = parseWeekKey(weekStart);
  const weekEndDate = getWeekEnd(weekStartDate);

  const periodDays = breakdown.periodDays ?? 7;
  const isMultiWeekReport = periodDays > 7;

  const activityStart =
    breakdown.periodStart ?? posthogPeriod.start ?? format(weekStartDate, "yyyy-MM-dd");
  const activityEnd =
    breakdown.periodEnd ?? posthogPeriod.end ?? format(weekEndDate, "yyyy-MM-dd");

  const activityLabel =
    breakdown.periodLabel ??
    `${format(weekStartDate, "MMM d")} – ${format(weekEndDate, "MMM d, yyyy")}`;

  const socialRange = isMultiWeekReport
    ? `${activityLabel} (${periodDays} days · Metricool PDF)`
    : `${activityLabel} (Mon–Sun)`;

  const siteRange =
    posthogPeriod.start && posthogPeriod.end
      ? `${posthogPeriod.start} – ${posthogPeriod.end}`
      : socialRange;

  const hasSocialData = Boolean(report?.metricool_synced_at && (report.metricool_video_views > 0 || report.metricool_engagement > 0));
  const hasSiteData = Boolean(report?.posthog_synced_at);

  const rows: PeriodScopeRow[] = [
    {
      label: "Social · @gofinalrev",
      range: hasSocialData ? socialRange : "No data imported",
      scope: "period",
      detail: "Metricool video views and reach — all social accounts combined.",
    },
    {
      label: "Tooltrace.ai",
      range: hasSiteData ? siteRange : "Not synced",
      scope: "period",
      detail: "PostHog visitors, Pro subs, and funnel on tooltrace.ai (project 167207).",
    },
    {
      label: "finalREV.com",
      range: hasSiteData ? siteRange : "Not synced",
      scope: "period",
      detail: "PostHog STEP uploads (cad_upload) on finalrev.com (project 209711).",
    },
    {
      label: "Follower / member counts",
      range: "Live snapshot",
      scope: "live",
      detail: "Current @gofinalrev totals toward milestones — not weekly gains.",
    },
  ];

  return {
    weekKey: weekStart,
    weekLabel: formatWeekLabel(weekStartDate),
    activityLabel,
    activityStart,
    activityEnd,
    periodDays,
    isMultiWeekReport,
    isCurrentCalendarWeek: weekStart === getCurrentWeekKey(),
    hasSocialData,
    hasSiteData,
    comparisonLabel: isMultiWeekReport ? "vs prior period" : "vs last week",
    showWeekOverWeek: !isMultiWeekReport,
    rows,
  };
}
