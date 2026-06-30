import { formatNumber } from "@/lib/utils";
import type { IntelligenceInput } from "./types";
import { buildContentPnl } from "./content-pnl";
import { canAttributeSocialToTooltrace, resolveContentFocus } from "./content-focus";
import { parseReportBreakdown, parseReportFunnel, shopFloorSignal } from "./context";
import { platformLabel } from "@/lib/post-highlights";

export function buildBoardNarrative(input: IntelligenceInput): string {
  const { report, context, posts } = input;
  if (!report) {
    return "No weekly data yet. Import the Metricool PDF to generate the board narrative.";
  }

  const pnl = buildContentPnl(input);
  const funnel = parseReportFunnel(report);
  const breakdown = parseReportBreakdown(report);
  const topPost = posts.length ? [...posts].sort((a, b) => b.views - a.views)[0] : null;
  const linked = canAttributeSocialToTooltrace(resolveContentFocus(posts));

  const period = context.isMultiWeekReport ? context.activityLabel : `the week of ${context.activityLabel}`;

  const socialPart =
    report.metricool_video_views > 0
      ? `${formatNumber(report.metricool_video_views)} @gofinalrev views`
      : null;
  const siteParts: string[] = [];
  if (report.posthog_visitors > 0) {
    siteParts.push(
      linked
        ? `${formatNumber(report.posthog_visitors)} Tooltrace visitors`
        : `${formatNumber(report.posthog_visitors)} Tooltrace site visitors (separate from current social clips)`,
    );
  }
  if (report.posthog_subscriptions > 0) siteParts.push(`${report.posthog_subscriptions} new Pro subs`);
  if ((funnel?.finalrevCadUploads ?? 0) > 0) siteParts.push(`${funnel!.finalrevCadUploads} STEP uploads`);

  let para1: string;
  if (socialPart && siteParts.length > 0) {
    para1 = linked
      ? `For ${period}, content drove ${socialPart}, ${siteParts.join(", ")}.`
      : `For ${period}, ${socialPart}. Tooltrace site: ${siteParts.join(", ")}.`;
  } else if (socialPart) {
    para1 = `For ${period}, ${socialPart}.`;
  } else if (siteParts.length > 0) {
    para1 = `For ${period}, Tooltrace site: ${siteParts.join(", ")}.`;
  } else {
    para1 = `For ${period}, social and product metrics are still filling in.`;
  }

  if (pnl.quotePipelineHigh > 0 && pnl.stepUploads > 0) {
    para1 += ` Estimated quote pipeline from uploads: $${formatNumber(pnl.quotePipelineLow)}–$${formatNumber(pnl.quotePipelineHigh)}.`;
  }

  let para2: string;
  if (!linked && report.metricool_video_views > 500) {
    para2 =
      "Social is finalREV shop-floor today; Tooltrace Shorts ship on a separate track. Do not read Tooltrace site traffic as proof of social clip performance yet.";
  } else if (report.posthog_subscriptions > 0 && (funnel?.analysis?.conversionRate ?? 0) >= 1.5) {
    para2 = "Conversion rate acceptable when Tooltrace traffic arrives. Increase volume from top referrers.";
  } else if (linked && report.metricool_video_views > 500 && report.posthog_visitors < 30) {
    para2 = "Social views not converting to site visits. Review CTAs on Tooltrace-tagged posts.";
  } else if (shopFloorSignal(topPost?.title ?? "")) {
    para2 = "Shop-floor manufacturing content supports finalREV quote trust and YouTube reach.";
  } else {
    para2 = "Continue logging post stats and tagging product (finalREV vs Tooltrace) per clip.";
  }

  const yt = breakdown?.platforms.find((p) => p.platform === "youtube");
  const ig = breakdown?.platforms.find((p) => p.platform === "instagram");
  if (yt && ig && yt.videoViews > (ig.videoViews ?? 0) * 1.5) {
    para2 = "YouTube views exceed Instagram by >50%. Prioritize Shorts; adapt separately for Reels.";
  }

  const para3 = `Next week: ${pnl.nextDollarMove}`;

  if (report.locked_findings?.trim()) {
    return `${para1} ${para2} Locked in: ${report.locked_findings.trim()} ${para3}`;
  }

  if (topPost) {
    return `${para1} ${para2} Top clip: "${topPost.title}" on ${platformLabel(topPost.platform)}. ${para3}`;
  }

  return `${para1} ${para2} ${para3}`;
}
