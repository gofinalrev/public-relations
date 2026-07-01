import { formatNumber } from "@/lib/utils";
import type { CompetitivePulse, IntelligenceInput } from "./types";
import { aestheticSignal, parseReportBreakdown, shopFloorSignal } from "./context";

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

  let yourStrength = "Shop-floor CNC and machinery content.";
  let gap = "DFM education and quote transparency on LinkedIn.";
  let recommendation = "Pair one shop-floor Short with a LinkedIn DFM takeaway per week.";

  if (yt && ig && yt.videoViews > (ig.videoViews ?? 0) * 1.3) {
    yourStrength = `YouTube Shorts: ${formatNumber(yt.videoViews)} views; above typical IG-first benchmarks.`;
    gap = "Instagram Reels under-indexing vs YouTube for the same clips.";
    recommendation = "Post on YouTube first, then adapt cover text for Instagram.";
  }

  if (shopViews > aestheticViews * 2 && shopViews > 0) {
    yourStrength = "Shop-floor hooks averaged higher views than aesthetic edits this period.";
  } else if (aestheticViews > shopViews * 2 && aestheticViews > 0) {
    gap = "Aesthetic edits lead views; shop-floor hooks may reach CNC audience better.";
    recommendation = "Test shop-floor opening frame on the next finalREV Short.";
  }

  if (li && li.impressions > 200) {
    yourStrength += ` LinkedIn: ${formatNumber(li.impressions)} impressions this period.`;
  }

  return {
    headline: "Your channel mix this period (no external benchmark data)",
    yourStrength,
    gap,
    recommendation,
  };
}
