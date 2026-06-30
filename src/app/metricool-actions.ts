"use server";

import { revalidatePath } from "next/cache";
import { isMetricoolConfigured } from "@/lib/metricool/config";
import { fetchWeeklyMetricoolMetrics } from "@/lib/metricool/metrics";
import { analyzeGrowthFunnel, buildCombinedLearning, formatGrowthInsights } from "@/lib/metricool/insights";
import { getWeeklyReport, upsertMetricoolSync, mergeGrowthInsights, getAllChannels, updateActionItems } from "@/lib/db";
import { getPreviousWeekKey } from "@/lib/weeks";
import { isPostHogConfigured } from "@/lib/posthog/config";
import { fetchWeeklyPostHogMetrics, fetchPostHogMetricsForPeriod } from "@/lib/posthog/metrics";
import { buildActionItems, parseStoredInsights } from "@/lib/action-items";
import { buildDashboardPeriodContext } from "@/lib/period-context";
import { postWeeklyDigest } from "@/lib/slack/weekly-digest";

async function redditSetupNeeded(): Promise<boolean> {
  const reddit = (await getAllChannels()).find((c) => c.slug === "reddit");
  return reddit?.status === "setup_needed";
}

async function fetchAlignedPostHog(weekStart: string, breakdown: Record<string, unknown> | null) {
  if (!isPostHogConfigured()) return null;

  const periodStart = breakdown?.periodStart as string | undefined;
  const periodEnd = breakdown?.periodEnd as string | undefined;
  const periodDays = breakdown?.periodDays as number | undefined;

  if (periodStart && periodEnd && periodDays && periodDays > 7) {
    return fetchPostHogMetricsForPeriod(periodStart, periodEnd, weekStart).catch(() => null);
  }

  return fetchWeeklyPostHogMetrics(weekStart).catch(() => null);
}

export async function syncMetricoolForWeek(weekStart: string) {
  if (!isMetricoolConfigured()) {
    return { ok: false as const, error: "Metricool not configured" };
  }

  try {
    const existing = await getWeeklyReport(weekStart);
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    if (existing?.metricool_synced_at && new Date(existing.metricool_synced_at).getTime() > oneHourAgo) {
      return { ok: true as const, skipped: true, report: existing };
    }

    const [metrics, previousMetrics, posthogMetrics] = await Promise.all([
      fetchWeeklyMetricoolMetrics(weekStart),
      fetchWeeklyMetricoolMetrics(getPreviousWeekKey(weekStart)).catch(() => null),
      fetchWeeklyPostHogMetrics(weekStart).catch(() => null),
    ]);

    const growthInsights = analyzeGrowthFunnel(metrics, posthogMetrics, previousMetrics, {
      redditSetupNeeded: await redditSetupNeeded(),
    });
    const combinedLearning = buildCombinedLearning(metrics, posthogMetrics);

    const channelUpdates = metrics.platforms.map((p) => ({
      slug: p.platform === "x" ? "x" : p.platform,
      current_value: p.followers,
    }));

    const report = await upsertMetricoolSync(weekStart, {
      videoViews: metrics.totalVideoViews,
      engagement: metrics.totalEngagement,
      breakdownJson: JSON.stringify(metrics),
      growthInsights: formatGrowthInsights(growthInsights),
      channelUpdates,
      learning: combinedLearning || undefined,
    });

    const context = buildDashboardPeriodContext(weekStart, report);
    await postWeeklyDigest({ weekStart, report, context, source: "metricool-api" });

    revalidatePath("/");
    return { ok: true as const, report, metrics, growthInsights };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Metricool sync failed",
    };
  }
}

export async function refreshGrowthInsights(weekStart: string) {
  const report = await getWeeklyReport(weekStart);
  if (!report?.metricool_breakdown_json) return;

  try {
    const metricool = JSON.parse(report.metricool_breakdown_json);
    const prevReport = await getWeeklyReport(getPreviousWeekKey(weekStart));
    const previousMetricool = prevReport?.metricool_breakdown_json
      ? JSON.parse(prevReport.metricool_breakdown_json)
      : null;

    const posthog = await fetchAlignedPostHog(weekStart, metricool);

    const growthInsights = analyzeGrowthFunnel(metricool, posthog, previousMetricool, {
      periodDays: metricool.periodDays,
      periodLabel: metricool.periodLabel,
      redditSetupNeeded: await redditSetupNeeded(),
    });
    await mergeGrowthInsights(weekStart, formatGrowthInsights(growthInsights));

    const growthParsed = growthInsights;
    const posthogParsed = parseStoredInsights(report.posthog_insights);
    await updateActionItems(
      weekStart,
      JSON.stringify(buildActionItems(growthParsed, posthogParsed, report.action_items_json)),
    );

    revalidatePath("/");
  } catch {
    // ignore parse errors
  }
}
