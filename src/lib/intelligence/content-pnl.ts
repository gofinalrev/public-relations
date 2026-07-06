import { formatNumber } from "@/lib/utils";
import type { ContentPnl, IntelligenceInput } from "./types";
import { parseReportFunnel } from "./context";
import { parallelTracksNote, resolveContentFocus } from "./content-focus";

function viewsDeltaPhrase(current: number, previous: number): string | null {
  if (previous <= 0) return null;
  const delta = current - previous;
  if (delta === 0) return null;
  return delta > 0
    ? `up ${formatNumber(delta)} vs last period`
    : `down ${formatNumber(Math.abs(delta))} vs last period`;
}

export function buildContentPnl(input: IntelligenceInput): ContentPnl {
  const { report, previousReport, posts } = input;
  const views = report?.metricool_video_views ?? 0;
  const visitors = report?.posthog_visitors ?? 0;
  const subs = report?.posthog_subscriptions ?? 0;
  const funnel = parseReportFunnel(report);
  const stepUploads = funnel?.finalrevCadUploads ?? 0;
  const focus = resolveContentFocus(posts);

  const topPost = posts.length ? [...posts].sort((a, b) => b.views - a.views)[0] : null;
  const prevViews = previousReport?.metricool_video_views ?? 0;
  const viewsDelta = viewsDeltaPhrase(views, prevViews);
  const viewsUp = prevViews > 0 && views > prevViews * 1.1;

  let nextStep = "Log your top posts with views and tag each as finalREV or Tooltrace.";
  if (topPost && topPost.views >= 500) {
    nextStep = `"${topPost.title}" is your top post (${formatNumber(topPost.views)} views). Cross-post it to whichever platform it lagged on.`;
    if (topPost.product === "finalrev" || !topPost.product) {
      nextStep += " Link to finalrev.com/quote if the clip is shop-floor.";
    } else if (topPost.product === "tooltrace" || topPost.product === "both") {
      nextStep += " Pin tooltrace.ai if the clip targets Tooltrace.";
    }
  } else if (viewsUp && viewsDelta) {
    nextStep = `Views ${viewsDelta}. Keep posting while momentum holds.`;
  } else if (views > 0) {
    nextStep = "Maintain your Shorts cadence on @gofinalrev.";
  } else if (visitors > 0 && subs === 0) {
    nextStep = `${formatNumber(visitors)} Tooltrace visitors logged, 0 new Pro subs — check PostHog/Stripe before drawing conclusions.`;
  }

  let headline: string;
  if (views > 0) {
    const socialPart = `${formatNumber(views)} @gofinalrev views${viewsDelta ? ` (${viewsDelta})` : ""}`;
    headline = `${socialPart}. ${formatNumber(visitors)} Tooltrace visitors.`;
  } else if (visitors > 0) {
    headline = `${formatNumber(visitors)} Tooltrace visitors · ${stepUploads} STEP upload${stepUploads === 1 ? "" : "s"}`;
  } else if (stepUploads > 0) {
    headline = `${stepUploads} STEP upload${stepUploads === 1 ? "" : "s"} on finalrev.com this period`;
  } else {
    headline = "Site metrics sync from PostHog; social views import with the Metricool PDF";
  }

  if (focus === "tooltrace" || focus === "mixed") {
    headline += " Logged posts include Tooltrace clips — site traffic is not attributed per post.";
  }

  return {
    socialViews: views,
    tooltraceVisitors: visitors,
    proSubs: subs,
    stepUploads,
    bestRoiClip: topPost?.title ?? null,
    nextStep,
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

  const rate = (num: number, den: number) => (den > 0 ? (num / den) * 100 : null);

  const storySteps = [
    { label: "@gofinalrev views", value: views, rateFromPrev: null, track: "social" as const },
    { label: "Tooltrace visitors", value: visitors, rateFromPrev: null, track: "tooltrace" as const },
    {
      label: "Tooltrace Pro",
      value: subs,
      rateFromPrev: rate(subs, visitors),
      track: "tooltrace" as const,
    },
    { label: "finalREV STEP uploads", value: steps, rateFromPrev: null, track: "finalrev" as const },
  ];

  const parts: string[] = [parallelTracksNote(focus)];
  if (views > 0) parts.push(`${formatNumber(views)} @gofinalrev views (Metricool)`);
  if (visitors > 0) parts.push(`${formatNumber(visitors)} Tooltrace visitors (PostHog)`);
  if (subs > 0) parts.push(`${subs} Pro signup event${subs === 1 ? "" : "s"} in PostHog — verify in Stripe if sharing externally`);
  if (steps > 0) parts.push(`${steps} STEP upload${steps === 1 ? "" : "s"} on finalrev.com`);

  return {
    steps: storySteps,
    narrative: parts.join(". ") + ".",
    mode: "parallel",
  };
}
