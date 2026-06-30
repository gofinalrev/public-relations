import type { MetricoolWeeklyMetrics } from "./metrics";
import type { PostHogWeeklyMetrics } from "@/lib/posthog/metrics";
import { formatNumber } from "@/lib/utils";

export type GrowthInsight = {
  type: "success" | "warning" | "info" | "critical";
  title: string;
  body: string;
};

export type GrowthAnalysisContext = {
  periodDays?: number;
  periodLabel?: string;
  redditSetupNeeded?: boolean;
};

function periodPhrase(ctx?: GrowthAnalysisContext): string {
  if (ctx?.periodDays && ctx.periodDays > 7) return "this reporting period";
  return "this week";
}

function comparablePeriods(
  currentDays: number | undefined,
  previous: MetricoolWeeklyMetrics | null,
): boolean {
  if (!previous || !currentDays) return currentDays === undefined || currentDays <= 7;
  const prevDays =
    previous.periodStart && previous.periodEnd
      ? daysBetween(previous.periodStart, previous.periodEnd)
      : 7;
  return Math.abs(currentDays - prevDays) <= 2;
}

function daysBetween(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24)) + 1;
}

export function analyzeGrowthFunnel(
  metricool: MetricoolWeeklyMetrics | null,
  posthog: PostHogWeeklyMetrics | null,
  previousMetricool: MetricoolWeeklyMetrics | null,
  context?: GrowthAnalysisContext,
): GrowthInsight[] {
  const insights: GrowthInsight[] = [];
  if (!metricool && !posthog) return insights;

  const period = periodPhrase(context);
  const periodDays = context?.periodDays ?? 7;
  const isMultiWeek = periodDays > 7;

  const socialViews = metricool?.totalVideoViews ?? 0;
  const socialEngagement = metricool?.totalEngagement ?? 0;
  const siteVisitors = posthog?.uniqueVisitors ?? 0;
  const subs = posthog?.newSubscriptions ?? 0;

  const prevViews = previousMetricool?.totalVideoViews ?? null;
  const prevEngagement = previousMetricool?.totalEngagement ?? null;
  const canComparePeriods = comparablePeriods(periodDays, previousMetricool);

  if (isMultiWeek && context?.periodLabel) {
    insights.push({
      type: "info",
      title: "Multi-week Metricool report",
      body: `Social covers ${context.periodLabel}. PostHog uses the same range when synced from PDF.`,
    });
  }

  // North star: social → site → subscription
  if (socialViews >= 100) {
    const visitorRatio = siteVisitors / socialViews;
    const weakConversion = isMultiWeek ? visitorRatio < 0.15 : socialViews > 500 && siteVisitors < 30;
    if (weakConversion) {
      insights.push({
        type: "critical",
        title: "Social reach isn't reaching the product",
        body: `${formatNumber(socialViews)} views, ${formatNumber(siteVisitors)} Tooltrace visits in ${period}. Turn up bio links, pinned comments, and end-card CTAs to tooltrace.ai/designer.`,
      });
    }
  }

  if (siteVisitors >= (isMultiWeek ? 50 : 50) && subs === 0) {
    insights.push({
      type: "warning",
      title: "Site traffic without Pro conversions",
      body: `${formatNumber(siteVisitors)} Tooltrace visitors in ${period}, 0 Pro subs. Upload→generate→download demos beat pure shop-floor ASMR.`,
    });
  }

  if (subs > 0 && socialViews > 0 && siteVisitors > 0) {
    const rate = ((subs / siteVisitors) * 100).toFixed(1);
    insights.push({
      type: "success",
      title: "Full funnel working",
      body: `${formatNumber(socialViews)} views → ${formatNumber(siteVisitors)} Tooltrace visitors → ${subs} Pro sub${subs === 1 ? "" : "s"} (${rate}% Tooltrace conversion in ${period}). Document which post drove this.`,
    });
  }

  // Platform-specific — only when Metricool has signal for that platform
  for (const p of metricool?.platforms ?? []) {
    if (p.platform === "linkedin" && p.impressions > 100) {
      const clicks =
        p.engagement > 0 && p.engagement < p.impressions ? p.engagement : undefined;
      insights.push({
        type: "info",
        title: "LinkedIn B2B impressions",
        body: `${formatNumber(p.impressions)} impressions, ${formatNumber(p.followers)} followers${clicks !== undefined ? `, ${formatNumber(clicks)} interactions` : ""} in ${period}. Shop-floor + Datron posts feed finalrev.com quotes.`,
      });
    }
    if (p.platform === "youtube" && p.videoViews > 0 && p.followers < 1000) {
      insights.push({
        type: "info",
        title: "YouTube views below Partner threshold",
        body: `${formatNumber(p.videoViews)} views, ${formatNumber(p.followers)}/1,000 subs (YPP) in ${period}. Cross-post top X/IG Shorts to @gofinalrev.`,
      });
    } else if (p.platform === "youtube" && p.videoViews === 0 && p.followers < 1000) {
      insights.push({
        type: "warning",
        title: "YouTube Partner gap",
        body: `${formatNumber(p.followers)}/1,000 subs (YPP), no views logged in ${period}. Cross-post top X/IG Shorts to @gofinalrev.`,
      });
    }
    if (p.platform === "instagram" && p.videoViews > 0) {
      insights.push({
        type: "info",
        title: "IG Reels getting views",
        body: `${formatNumber(p.videoViews)} reel views, ${formatNumber(p.followers)} followers in ${period}. Reaching non-followers. Post more often.`,
      });
    }
    if (p.platform === "tiktok" && p.videoViews > 100) {
      insights.push({
        type: "info",
        title: "TikTok views building",
        body: `${formatNumber(p.videoViews)} TikTok views in ${period}. Repurpose top YouTube Shorts hooks. CTA in bio.`,
      });
    }
    if (p.platform === "facebook" && p.impressions > 50) {
      insights.push({
        type: "info",
        title: "Facebook reach active",
        body: `${formatNumber(p.impressions)} FB impressions in ${period}. Cross-post LinkedIn shop-floor content for older maker demographic.`,
      });
    }
  }

  if (canComparePeriods && prevViews !== null && prevViews > 0) {
    const viewDelta = ((socialViews - prevViews) / prevViews) * 100;
    const compareLabel = isMultiWeek ? "period-over-period" : "WoW";
    if (viewDelta > 30) {
      insights.push({
        type: "success",
        title: "Video views surging",
        body: `Views +${viewDelta.toFixed(0)}% ${compareLabel}. Find the breakout post. Repurpose its hook on YT + LinkedIn.`,
      });
    } else if (viewDelta < -20) {
      insights.push({
        type: "warning",
        title: "Video views dipped",
        body: `Views -${Math.abs(viewDelta).toFixed(0)}% ${compareLabel}. Try CAD vs AI split-screens over pure aesthetic edits.`,
      });
    }
  }

  if (
    canComparePeriods &&
    prevEngagement !== null &&
    socialEngagement > prevEngagement * 1.5 &&
    socialViews <= (prevViews ?? socialViews)
  ) {
    insights.push({
      type: "info",
      title: "Engagement outpacing views",
      body: `Engagement up, views flat in ${period}. Algorithm favors depth. Reply to every comment.`,
    });
  }

  return insights;
}

export function formatGrowthInsights(insights: GrowthInsight[]): string {
  return insights.map((i) => `[${i.type.toUpperCase()}] ${i.title}: ${i.body}`).join("\n\n");
}

export function buildCombinedLearning(
  metricool: MetricoolWeeklyMetrics | null,
  posthog: PostHogWeeklyMetrics | null,
  context?: GrowthAnalysisContext,
): string {
  const parts: string[] = [];
  const period = context?.periodLabel;

  if (metricool) {
    const top = [...metricool.platforms].sort((a, b) => b.videoViews - a.videoViews)[0];
    if (top && top.videoViews > 0) {
      parts.push(`${top.name} drove ${formatNumber(top.videoViews)} views`);
    }
    parts.push(`${formatNumber(metricool.totalEngagement)} total social reach + clicks`);
  }
  if (posthog) {
    parts.push(`${formatNumber(posthog.uniqueVisitors)} Tooltrace visitors`);
    if (posthog.newSubscriptions > 0) {
      parts.push(`${posthog.newSubscriptions} new Pro subs`);
    } else if (posthog.uniqueVisitors > 20) {
      parts.push("zero Pro conversions");
    }
  }
  if (parts.length === 0) return "";
  const s = parts.join(", ");
  const sentence = s.charAt(0).toUpperCase() + s.slice(1) + ".";
  return period ? `${sentence} (${period})` : sentence;
}
