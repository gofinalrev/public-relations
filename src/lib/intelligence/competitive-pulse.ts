import { formatNumber } from "@/lib/utils";
import type { CompetitivePulse, IntelligenceInput } from "./types";
import { aestheticSignal, parseReportBreakdown, shopFloorSignal } from "./context";

function formatRatio(a: number, b: number): string {
  if (b <= 0) return "—";
  const ratio = a / b;
  if (ratio >= 10) return `${Math.round(ratio)}×`;
  return `${ratio.toFixed(1)}×`;
}

export function buildCompetitivePulse(input: IntelligenceInput): CompetitivePulse {
  const { report, posts } = input;
  const breakdown = parseReportBreakdown(report);

  const yt = breakdown?.platforms.find((p) => p.platform === "youtube");
  const ig = breakdown?.platforms.find((p) => p.platform === "instagram");
  const li = breakdown?.platforms.find((p) => p.platform === "linkedin");

  const shopFloorPosts = posts.filter((p) => shopFloorSignal(p.title));
  const aestheticPosts = posts.filter((p) => aestheticSignal(p.title));
  const shopViews = shopFloorPosts.reduce((s, p) => s + p.views, 0);
  const aestheticViews = aestheticPosts.reduce((s, p) => s + p.views, 0);

  const ytViews = yt?.videoViews ?? 0;
  const igViews = ig?.videoViews ?? 0;

  let headline = "Channel mix this period";
  let yourStrength = "Log individual post stats to compare platforms.";
  let gap = "—";
  let recommendation = "Add views from YouTube Studio or IG Insights under Post performance.";

  if (ytViews > 0 || igViews > 0) {
    headline = `YouTube ${formatNumber(ytViews)} views · Instagram ${formatNumber(igViews)} views`;

    if (ytViews > igViews * 1.25) {
      yourStrength = `YouTube led with ${formatNumber(ytViews)} views (${formatRatio(ytViews, igViews)} Instagram).`;
      gap =
        igViews > 0
          ? `Instagram only ${formatNumber(igViews)} views on similar clips.`
          : "No Instagram views logged this period.";
      recommendation = "Publish on YouTube first, then re-cut the cover for Reels.";
    } else if (igViews > ytViews * 1.25) {
      yourStrength = `Instagram led with ${formatNumber(igViews)} views (${formatRatio(igViews, ytViews)} YouTube).`;
      gap = `YouTube had ${formatNumber(ytViews)} views on the same period.`;
      recommendation = "Study what worked on Reels and mirror the hook on YouTube Shorts.";
    } else if (ytViews > 0 && igViews > 0) {
      yourStrength = `YouTube and Instagram were close (${formatNumber(ytViews)} vs ${formatNumber(igViews)} views).`;
      gap = "Neither platform clearly won — hooks may need to differ by platform.";
      recommendation = "Try a different opening frame on the next clip for the weaker platform.";
    } else if (ytViews > 0) {
      yourStrength = `${formatNumber(ytViews)} YouTube views logged.`;
      gap = "Instagram had no views this period.";
      recommendation = "Cross-post the top YouTube clip to Instagram with a native cover.";
    } else {
      yourStrength = `${formatNumber(igViews)} Instagram views logged.`;
      gap = "YouTube had no views this period.";
      recommendation = "Upload the same clip to YouTube Shorts with a keyword-rich title.";
    }
  }

  if (shopViews > aestheticViews * 1.5 && shopViews > 0) {
    yourStrength = `Shop-floor posts: ${formatNumber(shopViews)} views vs ${formatNumber(aestheticViews)} on aesthetic edits.`;
  } else if (aestheticViews > shopViews * 1.5 && aestheticViews > 0) {
    gap = `Aesthetic edits (${formatNumber(aestheticViews)} views) beat shop-floor (${formatNumber(shopViews)}).`;
    recommendation = "Try leading with CNC/spindle footage on the next clip.";
  }

  if (li && li.impressions > 0) {
    yourStrength = `${yourStrength.replace(/\.$/, "")}. LinkedIn: ${formatNumber(li.impressions)} impressions.`;
  }

  return {
    headline,
    yourStrength,
    gap,
    recommendation,
  };
}
