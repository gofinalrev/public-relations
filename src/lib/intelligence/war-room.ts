import { buildUtmUrl } from "@/lib/utm";
import { formatNumber } from "@/lib/utils";
import type { IntelligenceInput, WarRoomAlert } from "./types";
import { canAttributeSocialToTooltrace, resolveContentFocus } from "./content-focus";

export function buildWarRoom(input: IntelligenceInput): WarRoomAlert | null {
  const { report, previousReport, posts } = input;
  if (!report) return null;

  const views = report.metricool_video_views;
  const visitors = report.posthog_visitors;
  const prevViews = previousReport?.metricool_video_views ?? 0;
  const prevVisitors = previousReport?.posthog_visitors ?? 0;
  const focus = resolveContentFocus(posts);
  const linked = canAttributeSocialToTooltrace(focus);

  const viewsSpike = prevViews > 0 && views >= prevViews * 1.5 && views >= 800;
  const visitorSpike = prevVisitors > 0 && visitors >= prevVisitors * 2 && visitors >= 40;
  const climbingPost = posts.find((p) => {
    if (!p.publishedAt) return false;
    const age = Math.round((Date.now() - new Date(p.publishedAt).getTime()) / 86400000);
    return age <= 3 && p.views >= 500;
  });

  if (!viewsSpike && !visitorSpike && !climbingPost) return null;

  const topPost = climbingPost ?? (posts.length ? [...posts].sort((a, b) => b.views - a.views)[0] : null);
  const severity = viewsSpike && views >= 2000 ? "hot" : "warm";

  const brand = linked && topPost?.product === "tooltrace" ? "tooltrace" : "finalrev";
  const utmLink = buildUtmUrl(
    brand,
    "youtube",
    "video",
    "war-room",
    topPost?.title.slice(0, 40),
  );

  const pinnedComment =
    brand === "tooltrace"
      ? "Tooltrace designer: tooltrace.ai/designer (link in bio)"
      : "Get a CNC quote: finalrev.com/quote (link in bio)";

  let body: string;
  if (viewsSpike) {
    body = `Social views ${formatNumber(views)} (+${Math.round(((views - prevViews) / prevViews) * 100)}% vs last period). Review top @gofinalrev posts.`;
  } else if (linked && topPost) {
    body = `Tooltrace visitors ${formatNumber(visitors)}. "${topPost.title}" may be driving traffic.`;
  } else if (visitorSpike) {
    body = `Tooltrace visitors ${formatNumber(visitors)} (+${Math.round(((visitors - prevVisitors) / prevVisitors) * 100)}% vs last period). Check PostHog referrers; current social clips are finalREV-only and are not attributed here.`;
  } else {
    body = `Tooltrace visitors ${formatNumber(visitors)}. Check referrers in Details.`;
  }

  const followUp =
    viewsSpike && topPost
      ? `Consider a follow-up shop-floor Short referencing "${topPost.title}".`
      : linked
        ? "Pin product CTA and check PostHog referrers in Details."
        : "Review PostHog referrers. Tooltrace traffic is tracked separately until Tooltrace clips ship.";

  return {
    active: true,
    severity,
    title: severity === "hot" ? "View spike detected" : "Traffic up vs last period",
    body,
    pinnedComment,
    utmLink,
    followUp,
  };
}

export function formatWarRoomSlack(alert: WarRoomAlert, hubUrl: string): string {
  return [
    `🔔 *${alert.title}*`,
    alert.body,
    `*Pinned comment:* ${alert.pinnedComment}`,
    `*Link:* ${alert.utmLink}`,
    `*Follow-up:* ${alert.followUp}`,
    `<${hubUrl}|Open PR Hub>`,
  ].join("\n");
}
