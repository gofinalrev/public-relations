import { formatNumber } from "@/lib/utils";
import type { ContentPnl, IntelligenceInput } from "./types";
import { parseReportFunnel, proAnnualValue, quoteValue } from "./context";
import {
  canAttributeSocialToTooltrace,
  parallelTracksNote,
  resolveContentFocus,
} from "./content-focus";

export function buildContentPnl(input: IntelligenceInput): ContentPnl {
  const { report, previousReport, posts } = input;
  const views = report?.metricool_video_views ?? 0;
  const visitors = report?.posthog_visitors ?? 0;
  const subs = report?.posthog_subscriptions ?? 0;
  const funnel = parseReportFunnel(report);
  const stepUploads = funnel?.finalrevCadUploads ?? 0;
  const focus = resolveContentFocus(posts);
  const linked = canAttributeSocialToTooltrace(focus);

  const visitRate = linked && views > 0 ? visitors / views : null;
  const conversionRate =
    funnel?.analysis?.conversionRate ?? (visitors > 0 ? (subs / visitors) * 100 : null);

  const quoteLow = stepUploads * quoteValue() * 0.6;
  const quoteHigh =
    stepUploads * quoteValue() * 1.4 + (linked ? visitors * 0.02 * quoteValue() : 0);
  const proValue = subs * proAnnualValue();

  const topPost = posts.length ? [...posts].sort((a, b) => b.views - a.views)[0] : null;
  const prevViews = previousReport?.metricool_video_views ?? 0;
  const viewsUp = prevViews > 0 && views > prevViews * 1.15;

  let nextDollarMove = "Log top post stats and tag product (finalREV vs Tooltrace) on each entry.";
  if (!linked) {
    if (topPost && topPost.views >= 500) {
      nextDollarMove = `Republish "${topPost.title}" on the platform where it lagged. CTA: finalrev.com/quote (shop-floor content).`;
    } else if (viewsUp) {
      nextDollarMove = "Views up vs last period. Ship another shop-floor Short; prep Tooltrace clip batch separately.";
    } else if (views > 0) {
      nextDollarMove = "Keep finalREV Shorts cadence (YPP, quote trust). Tooltrace clips ship on their own track when ready.";
    }
  } else if (topPost && topPost.views >= 500) {
    nextDollarMove = `Republish "${topPost.title}" hook on the platform where it lagged, with product CTA in pinned comment.`;
  } else if (views > 0 && (visitRate ?? 0) < 0.01) {
    nextDollarMove = "View-to-visitor rate below 1%. Strengthen Tooltrace link in bio and pinned comment on Tooltrace posts.";
  } else if (subs === 0 && visitors > 50) {
    nextDollarMove = "Visitors >50, Pro subs = 0. Test export demo in next Tooltrace Short.";
  } else if (viewsUp) {
    nextDollarMove = "Views up vs last period. Publish a follow-up using the same hook.";
  }

  const pipelineLow = Math.round(quoteLow + proValue * 0.5);
  const pipelineHigh = Math.round(quoteHigh + proValue);

  let headline: string;
  if (pipelineHigh > 0 && stepUploads > 0) {
    headline = `Estimated quote pipeline from STEP uploads: $${formatNumber(pipelineLow)}–$${formatNumber(pipelineHigh)} (model-based)`;
  } else if (views > 0 && !linked) {
    headline = `${formatNumber(views)} @gofinalrev views · ${formatNumber(visitors)} Tooltrace visitors (separate track)`;
  } else if (views > 0) {
    headline = `${formatNumber(views)} social views · ${formatNumber(visitors)} Tooltrace visitors`;
  } else {
    headline = "Import data to see performance summary";
  }

  return {
    socialViews: views,
    tooltraceVisitors: visitors,
    proSubs: subs,
    stepUploads,
    visitRate,
    conversionRate,
    quotePipelineLow: pipelineLow,
    quotePipelineHigh: pipelineHigh,
    proValue: Math.round(proValue),
    bestRoiClip: topPost?.title ?? null,
    nextDollarMove,
    headline,
  };
}

export function buildFunnelStory(input: IntelligenceInput): import("./types").FunnelStory {
  const { report, posts } = input;
  const views = report?.metricool_video_views ?? 0;
  const visitors = report?.posthog_visitors ?? 0;
  const subs = report?.posthog_subscriptions ?? 0;
  const funnel = parseReportFunnel(report);
  const steps = funnel?.finalrevCadUploads ?? 0;
  const focus = resolveContentFocus(posts);
  const linked = canAttributeSocialToTooltrace(focus);

  const rate = (num: number, den: number) => (den > 0 ? (num / den) * 100 : null);

  if (linked) {
    const storySteps = [
      { label: "Social views", value: views, rateFromPrev: null, track: "social" as const },
      { label: "Tooltrace visitors", value: visitors, rateFromPrev: rate(visitors, views), track: "tooltrace" as const },
      { label: "Tooltrace Pro", value: subs, rateFromPrev: rate(subs, visitors), track: "tooltrace" as const },
      { label: "finalREV STEP uploads", value: steps, rateFromPrev: rate(steps, visitors), track: "finalrev" as const },
    ];
    const narrative =
      views > 0
        ? `${((visitors / views) * 100).toFixed(1)}% of social views reached tooltrace.ai` +
          (subs > 0 ? `; ${subs} converted to Pro` : "") +
          (steps > 0 ? `; ${steps} STEP uploads on finalrev.com` : ".")
        : "Social → Tooltrace funnel appears once posts and Metricool data are logged.";

    return { steps: storySteps, narrative, mode: "linked" };
  }

  const storySteps = [
    { label: "@gofinalrev views", value: views, rateFromPrev: null, track: "social" as const },
    { label: "Tooltrace visitors", value: visitors, rateFromPrev: null, track: "tooltrace" as const },
    { label: "Tooltrace Pro", value: subs, rateFromPrev: rate(subs, visitors), track: "tooltrace" as const },
    { label: "finalREV STEP uploads", value: steps, rateFromPrev: null, track: "finalrev" as const },
  ];

  const parts: string[] = [parallelTracksNote(focus)];
  if (views > 0) parts.push(`${formatNumber(views)} @gofinalrev views this period`);
  if (visitors > 0) parts.push(`${formatNumber(visitors)} Tooltrace visitors (site/SEO; not attributed to current social clips)`);
  if (subs > 0) parts.push(`${subs} new Pro subs`);
  if (steps > 0) parts.push(`${steps} STEP uploads on finalrev.com`);

  return {
    steps: storySteps,
    narrative: parts.join(". ") + (parts.length > 1 ? "." : ""),
    mode: "parallel",
  };
}
