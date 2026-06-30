import type { PostHogWeeklyMetrics } from "./metrics";
import type { WeeklyReport } from "@/lib/db";
import { formatNumber } from "@/lib/utils";
import { isStripeSubsUnconfigured, logOps } from "@/lib/ops-log";
import { canAttributeSocialToTooltrace, resolveContentFocus } from "@/lib/intelligence/content-focus";
import { parsePostHighlights } from "@/lib/post-highlights";

export type PostHogInsight = {
  type: "success" | "warning" | "info" | "critical";
  title: string;
  body: string;
};

export type PostHogAnalysis = {
  insights: PostHogInsight[];
  suggestedLearning: string;
  suggestedFindings: string[];
  conversionRate: number | null;
  activationRate: number | null;
};

function pctChange(current: number, previous: number | null): number | null {
  if (previous === null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function rate(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return (numerator / denominator) * 100;
}

export function analyzePostHogWeek(
  current: PostHogWeeklyMetrics,
  previousMetrics: PostHogWeeklyMetrics | null,
  previousReport: WeeklyReport | null,
  currentReport: WeeklyReport | null,
): PostHogAnalysis {
  const insights: PostHogInsight[] = [];

  const visitors = current.uniqueVisitors;
  const subs = current.newSubscriptions;
  const conversionRate = rate(subs, visitors);
  const activationRate = rate(current.funnel.upload_image, visitors);

  const visitorDelta = pctChange(visitors, previousMetrics?.uniqueVisitors ?? null);
  const subsDelta = pctChange(subs, previousMetrics?.newSubscriptions ?? null);

  const posts = parsePostHighlights(currentReport?.post_highlights_json);
  const linked = canAttributeSocialToTooltrace(resolveContentFocus(posts));

  if (current.funnelUsedInference) {
    logOps(
      "Funnel upload/generate inferred from downloads — likely wrong PostHog project. Set POSTHOG_TOOLTRACE_PROJECT_ID=167207.",
    );
  }

  if (isStripeSubsUnconfigured(current.subscriptionEventUsed)) {
    logOps(
      "Subs stay at 0 until STRIPE_SECRET_KEY and STRIPE_PRO_PRICE_ID are in .env.local. Slack tracks real subs separately.",
    );
  }

  // Traffic vs conversion
  if (visitorDelta !== null && visitorDelta > 20 && (subsDelta === null || subsDelta <= 5)) {
    insights.push({
      type: "warning",
      title: "Traffic up, conversions flat",
      body: `Visitors +${visitorDelta.toFixed(0)}%, subs flat. Content drives curiosity, not upgrades. Sharpen CTA or show Pro value earlier.`,
    });
  }

  if (visitors > 0 && subs === 0 && !isStripeSubsUnconfigured(current.subscriptionEventUsed)) {
    insights.push({
      type: "critical",
      title: "Zero subscriptions this week",
      body: `${formatNumber(visitors)} Tooltrace visitors, 0 Pro signups. Awareness content may win views without moving people to checkout.`,
    });
  }

  if (conversionRate !== null && conversionRate >= 2) {
    insights.push({
      type: "success",
      title: "Strong conversion week",
      body: `${conversionRate.toFixed(1)}% visitor→sub (${subs}/${formatNumber(visitors)}). Find the referrer and landing path that drove this. Repeat it.`,
    });
  }

  // Funnel drop-offs (skip when stages were inferred from downloads)
  const { funnel } = current;
  const rawUpload = funnel.stages?.find((s) => s.stage === "upload")?.rawCount ?? funnel.upload_image;
  const rawGenerate = funnel.stages?.find((s) => s.stage === "generate")?.rawCount ?? funnel.generate_tool_outline;

  if (funnel.pageviews > 50 && rawUpload === 0 && funnel.download_cad === 0) {
    insights.push({
      type: "critical",
      title: "Landing without activation",
      body: "Pageviews but no uploads. Social hook may not match the landing page, or traffic bounces before designer loads.",
    });
  } else if (rawUpload > 0 && rawGenerate === 0 && funnel.download_cad === 0) {
    insights.push({
      type: "warning",
      title: "Uploads without AI generation",
      body: "Uploads but no AI generation. Check designer friction, tutorial drop-off, or unclear value after upload.",
    });
  } else if (funnel.generate_tool_outline > 5 && funnel.download_cad === 0) {
    insights.push({
      type: "warning",
      title: "Generated but didn't download",
      body: "Generated outlines but no CAD downloads. Users may hit Pro paywall at export. Demo the download step in content.",
    });
  }

  // Referrer intelligence
  const socialReferrers = current.topReferrers.filter((r) =>
    ["t.co", "twitter.com", "x.com", "instagram.com", "l.instagram.com", "youtube.com", "reddit.com", "www.reddit.com"].some(
      (s) => r.domain.includes(s),
    ),
  );
  const topSocial = socialReferrers[0];
  if (topSocial && topSocial.visitors >= 10) {
    insights.push({
      type: "info",
      title: `Top social referrer: ${topSocial.domain}`,
      body: `${formatNumber(topSocial.visitors)} visitors from ${topSocial.domain}. ${subs > 0 ? "Likely drove subs. Find the post." : "Traffic here, weak conversion. Audit landing for this audience."}`,
    });
  }

  const direct = current.topReferrers.find((r) => r.domain === "$direct" || r.domain === "direct");
  if (direct && direct.visitors > visitors * 0.5 && visitors > 20) {
    insights.push({
      type: "info",
      title: "Mostly direct traffic",
      body: "50%+ direct traffic. Add UTMs to bio links and video descriptions.",
    });
  }

  // Cross-reference Metricool if logged
  const metricoolViews = currentReport?.metricool_video_views ?? 0;
  const metricoolEngagement = currentReport?.metricool_engagement ?? 0;
  if (linked && metricoolViews > 1000 && visitors < 50) {
    insights.push({
      type: "warning",
      title: "Views ≠ Tooltrace visits",
      body: `${formatNumber(metricoolViews)} video views, ${formatNumber(visitors)} Tooltrace visits. Review CTAs on Tooltrace-tagged posts.`,
    });
  } else if (!linked && metricoolViews > 1000 && visitors > 0) {
    insights.push({
      type: "info",
      title: "Social and Tooltrace tracked separately",
      body: `${formatNumber(metricoolViews)} @gofinalrev views and ${formatNumber(visitors)} Tooltrace visitors. Current social clips are finalREV-only; compare referrers instead of view-to-visit rate.`,
    });
  }
  if (metricoolEngagement > 500 && visitors > 100 && subs === 0) {
    insights.push({
      type: "warning",
      title: "Engagement without revenue",
      body: `${formatNumber(metricoolEngagement)} engagement, ${formatNumber(visitors)} visitors, 0 subs. CAD vs AI demos may convert on X; aesthetic edits may not. Test product hooks.`,
    });
  }

  // Week-over-week subscription momentum
  if (subsDelta !== null && subsDelta > 50) {
    insights.push({
      type: "success",
      title: "Subscription change vs last week",
      body: `Pro subs +${subsDelta.toFixed(0)}% vs last week. Review posts from 3–5 days prior.`,
    });
  }

  const suggestedLearning = buildSuggestedLearning(current, previousMetrics, conversionRate, topSocial?.domain);
  const suggestedFindings = buildSuggestedFindings(insights, current, previousReport);

  if (insights.length === 0) {
    insights.push({
      type: "info",
      title: "Baseline week logged",
      body: "Not enough signal yet. Import another Metricool PDF next week for week-over-week comparisons.",
    });
  }

  return {
    insights,
    suggestedLearning,
    suggestedFindings,
    conversionRate,
    activationRate,
  };
}

function buildSuggestedLearning(
  current: PostHogWeeklyMetrics,
  previous: PostHogWeeklyMetrics | null,
  conversionRate: number | null,
  topReferrer?: string,
): string {
  const { uniqueVisitors, newSubscriptions } = current;
  const lines: string[] = [];

  if (topReferrer && uniqueVisitors > 20) {
    lines.push(
      `Tooltrace · Top referrer to tooltrace.ai: ${topReferrer.replace(/^www\./i, "").toLowerCase()}`,
    );
  }

  if (uniqueVisitors > 0) {
    const visitorChange = previous ? uniqueVisitors - previous.uniqueVisitors : 0;
    const delta =
      previous && Math.abs(visitorChange) >= 10
        ? ` (${visitorChange > 0 ? "up" : "down"} ${Math.abs(visitorChange)} vs last period)`
        : "";
    lines.push(`Tooltrace · ${formatNumber(uniqueVisitors)} visitors on tooltrace.ai${delta}`);
  }

  if (newSubscriptions > 0 && conversionRate !== null) {
    lines.push(
      `Tooltrace · ${newSubscriptions} new Pro sub${newSubscriptions === 1 ? "" : "s"} (${conversionRate.toFixed(1)}% visitor→Pro)`,
    );
  } else if (uniqueVisitors > 0 && newSubscriptions === 0) {
    lines.push("Tooltrace · 0 new Pro subs this period");
  }

  return lines.join("\n");
}

function buildSuggestedFindings(
  insights: PostHogInsight[],
  current: PostHogWeeklyMetrics,
  previousReport: WeeklyReport | null,
): string[] {
  const findings: string[] = [];

  for (const insight of insights.filter((i) => i.type === "warning" || i.type === "critical").slice(0, 2)) {
    findings.push(insight.body.split(".")[0] + ".");
  }

  if (current.funnel.download_cad > 0 && current.newSubscriptions === 0) {
    findings.push("Users download CAD but don't sub. Test Pro upsell right after first download.");
  }

  if (previousReport?.locked_findings) {
    findings.push(`Prior lock-in: "${previousReport.locked_findings.slice(0, 120)}${previousReport.locked_findings.length > 120 ? "…" : ""}". Still valid?`);
  }

  return findings.slice(0, 3);
}

export function formatInsightsForStorage(analysis: PostHogAnalysis): string {
  return analysis.insights.map((i) => `[${i.type.toUpperCase()}] ${i.title}: ${i.body}`).join("\n\n");
}
