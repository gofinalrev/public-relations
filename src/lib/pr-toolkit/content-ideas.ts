import type { Channel, WeeklyReport } from "@/lib/db";
import type { DashboardPeriodContext } from "@/lib/period-context";
import type { MetricoolWeeklyMetrics } from "@/lib/metricool/metrics";
import { SOCIAL_PLATFORMS } from "@/lib/platforms";
import { CONTENT_PILLARS } from "./copy-blocks";
import { resolveChannelGoal } from "@/lib/channel-goals";
import { parseStoredInsights } from "@/lib/action-items";
import { parsePostHighlights } from "@/lib/post-highlights";
import { formatNumber } from "@/lib/utils";

export type PrContentIdea = {
  id: string;
  priority: "high" | "medium" | "low";
  title: string;
  body: string;
  platforms: string[];
  pillar?: string;
};

export function buildPrContentIdeas(
  report: WeeklyReport | null,
  channels: Channel[],
  context: DashboardPeriodContext,
): PrContentIdea[] {
  const ideas: PrContentIdea[] = [];

  const growthInsights = parseStoredInsights(report?.growth_insights ?? "");
  const posthogInsights = parseStoredInsights(report?.posthog_insights ?? "");
  const topInsight = [...growthInsights, ...posthogInsights][0];

  if (topInsight) {
    ideas.push({
      id: "insight-driven",
      priority: topInsight.type === "critical" ? "high" : "medium",
      title: `This period: ${topInsight.title}`,
      body: topInsight.body,
      platforms: ["all"],
    });
  }

  let breakdown: MetricoolWeeklyMetrics | null = null;
  if (report?.metricool_breakdown_json) {
    try {
      breakdown = JSON.parse(report.metricool_breakdown_json) as MetricoolWeeklyMetrics;
    } catch {
      breakdown = null;
    }
  }

  if (breakdown?.platforms?.length) {
    const top = [...breakdown.platforms].sort((a, b) => b.videoViews - a.videoViews)[0];
    if (top && top.videoViews > 0) {
      ideas.push({
        id: "double-down-platform",
        priority: "high",
        title: `Increase output on ${top.name}`,
        body: `${formatNumber(top.videoViews)} views in ${context.activityLabel}. Repurpose the top hook on ${top.name} to other platforms.`,
        platforms: [top.platform],
      });
    }

    const laggard = [...breakdown.platforms]
      .filter((p) => p.videoViews === 0 && p.engagement === 0)
      .slice(0, 2);
    for (const p of laggard) {
      ideas.push({
        id: `wake-${p.platform}`,
        priority: "medium",
        title: `${p.name} was quiet this period`,
        body: `No activity logged. Cross-post a top YouTube Short or shop-floor clip with a ${p.name}-native caption.`,
        platforms: [p.platform],
      });
    }
  }

  const manualPosts = parsePostHighlights(report?.post_highlights_json);
  if (manualPosts.length > 0) {
    const topManual = [...manualPosts].sort((a, b) => b.views - a.views)[0];
    ideas.unshift({
      id: "manual-top-post",
      priority: "high",
      title: `Repurpose: ${topManual.title}`,
      body: `${formatNumber(topManual.views)} views on ${topManual.platform}. Cut a 15s hook for the platforms that haven't seen this clip yet.`,
      platforms: [topManual.platform],
      pillar: "shop-floor",
    });
  }

  const socialChannels = channels.filter((c) => c.platform !== "web");
  const furthest = [...socialChannels]
    .map((ch) => ({
      ch,
      resolved: resolveChannelGoal(ch, report, context),
    }))
    .sort((a, b) => a.resolved.progressPct - b.resolved.progressPct)[0];

  if (furthest && furthest.resolved.progressPct < 50) {
    const plat = SOCIAL_PLATFORMS[furthest.ch.platform as keyof typeof SOCIAL_PLATFORMS];
    ideas.push({
      id: "goal-push",
      priority: "high",
      title: `Push ${furthest.ch.name} toward goal`,
      body: `${formatNumber(furthest.resolved.displayValue)} / ${formatNumber(furthest.resolved.displayTarget)} ${furthest.ch.goal_metric} (all-time). ${furthest.ch.goal_label}. Push follower CTAs on ${plat?.handle ?? furthest.ch.name}.`,
      platforms: [furthest.ch.platform],
    });
  }

  let funnel: { upload_image?: number; download_cad?: number; pageviews?: number } | null = null;
  if (report?.posthog_funnel_json) {
    try {
      const parsed = JSON.parse(report.posthog_funnel_json) as {
        funnel?: { upload_image?: number; download_cad?: number; pageviews?: number };
      };
      funnel = parsed.funnel ?? null;
    } catch {
      funnel = null;
    }
  }

  if (funnel && (funnel.pageviews ?? 0) > 50 && (funnel.upload_image ?? 0) < (funnel.pageviews ?? 0) * 0.05) {
    ideas.push({
      id: "activation-gap",
      priority: "high",
      title: "Traffic without uploads",
      body: "High traffic, few uploads. Open with \"try uploading a photo\" in the first 3 seconds. Link to tooltrace.ai/designer.",
      platforms: ["youtube", "x", "instagram", "tiktok"],
      pillar: "product-demo",
    });
  }

  if (ideas.length < 3) {
    const pillar = CONTENT_PILLARS[ideas.length % CONTENT_PILLARS.length];
    ideas.push({
      id: `pillar-${pillar.id}`,
      priority: "low",
      title: pillar.title,
      body: `${pillar.idea} Formats: ${pillar.formats.join(", ")}.`,
      platforms: pillar.bestOn,
      pillar: pillar.id,
    });
  }

  return ideas.slice(0, 6);
}
