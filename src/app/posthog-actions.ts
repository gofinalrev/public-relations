"use server";

import { isPostHogConfigured } from "@/lib/posthog/config";
import { fetchWeeklyPostHogMetrics, fetchPostHogMetricsForPeriod } from "@/lib/posthog/metrics";
import { analyzePostHogWeek, formatInsightsForStorage } from "@/lib/posthog/insights";
import { getWeeklyReport, upsertPostHogSync } from "@/lib/db";
import { getPreviousWeekKey } from "@/lib/weeks";
import { revalidatePath } from "next/cache";
import { refreshGrowthInsights } from "@/app/metricool-actions";
import { fetchFinalRevCadUploadsForPeriod, fetchFinalRevCadUploadsForWeek } from "@/lib/posthog/finalrev-metrics";
import { syncFreeChannelStats } from "@/lib/social/sync";

async function fetchPostHogForReport(weekStart: string) {
  const existing = await getWeeklyReport(weekStart);
  let breakdown: Record<string, unknown> | null = null;
  if (existing?.metricool_breakdown_json) {
    try {
      breakdown = JSON.parse(existing.metricool_breakdown_json);
    } catch {
      breakdown = null;
    }
  }

  const periodStart = breakdown?.periodStart as string | undefined;
  const periodEnd = breakdown?.periodEnd as string | undefined;
  const periodDays = breakdown?.periodDays as number | undefined;

  if (periodStart && periodEnd && periodDays && periodDays > 7) {
    return fetchPostHogMetricsForPeriod(periodStart, periodEnd, weekStart);
  }

  return fetchWeeklyPostHogMetrics(weekStart);
}

export async function syncPostHogForWeek(weekStart: string) {
  if (!isPostHogConfigured()) {
    return { ok: false as const, error: "PostHog not configured" };
  }

  try {
    const existing = await getWeeklyReport(weekStart);
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    if (existing?.posthog_synced_at && new Date(existing.posthog_synced_at).getTime() > tenMinutesAgo) {
      return { ok: true as const, skipped: true, report: existing };
    }

    const [currentMetrics, previousMetrics] = await Promise.all([
      fetchPostHogForReport(weekStart),
      fetchWeeklyPostHogMetrics(getPreviousWeekKey(weekStart)).catch(() => null),
    ]);

    const previousReport = await getWeeklyReport(getPreviousWeekKey(weekStart));
    const analysis = analyzePostHogWeek(currentMetrics, previousMetrics, previousReport, existing);

    let finalRevUploads = 0;
    if (currentMetrics.periodStart && currentMetrics.periodEnd) {
      finalRevUploads = await fetchFinalRevCadUploadsForPeriod(
        currentMetrics.periodStart,
        currentMetrics.periodEnd,
        `${currentMetrics.periodStart}_${currentMetrics.periodEnd}`,
      );
    } else {
      finalRevUploads = await fetchFinalRevCadUploadsForWeek(weekStart);
    }

    const report = await upsertPostHogSync(weekStart, {
      visitors: currentMetrics.uniqueVisitors,
      subscriptions: currentMetrics.newSubscriptions,
      insights: formatInsightsForStorage(analysis),
      funnelJson: JSON.stringify({
        funnel: currentMetrics.funnel,
        topReferrers: currentMetrics.topReferrers,
        subscriptionEventUsed: currentMetrics.subscriptionEventUsed,
        funnelEventSources: currentMetrics.funnelEventSources,
        funnelUsedInference: currentMetrics.funnelUsedInference,
        finalrevCadUploads: finalRevUploads,
        periodStart: currentMetrics.periodStart,
        periodEnd: currentMetrics.periodEnd,
        fetchedAt: currentMetrics.fetchedAt,
        analysis: {
          conversionRate: analysis.conversionRate,
          activationRate: analysis.activationRate,
          suggestedFindings: analysis.suggestedFindings,
        },
      }),
      learning: analysis.suggestedLearning || undefined,
    });

    await syncFreeChannelStats();
    await refreshGrowthInsights(weekStart);

    revalidatePath("/");
    return { ok: true as const, report, analysis, metrics: currentMetrics };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Sync failed",
    };
  }
}
