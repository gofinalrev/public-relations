import { formatNumber } from "@/lib/utils";
import type { ClipAttribution, IntelligenceInput } from "./types";
import { canAttributeSocialToTooltrace, resolveContentFocus } from "./content-focus";
import type { PostHighlightProduct } from "@/lib/post-highlights";

function isTooltracePost(product?: PostHighlightProduct): boolean {
  return product === "tooltrace" || product === "both";
}

export function buildClipAttribution(input: IntelligenceInput): ClipAttribution[] {
  const { report, posts } = input;
  if (!report || posts.length === 0) return [];

  const focus = resolveContentFocus(posts);
  if (!canAttributeSocialToTooltrace(focus)) return [];

  const attributable = posts.filter((p) => isTooltracePost(p.product));
  if (attributable.length === 0) return [];

  const visitors = report.posthog_visitors;
  const totalViews = attributable.reduce((s, p) => s + p.views, 0);

  return [...attributable]
    .map((post) => {
      const share = totalViews > 0 ? post.views / totalViews : 1 / attributable.length;
      const estimatedVisitors = Math.round(visitors * share);
      const roiScore =
        post.views > 0 ? (estimatedVisitors / post.views) * 1000 + (post.likes / post.views) * 100 : 0;

      let payoffNote = "Modeled share of Tooltrace-tagged post views this period (not measured per clip).";
      if (post.views >= 1000 && estimatedVisitors >= 10) {
        payoffNote = `~${formatNumber(estimatedVisitors)} visitors (modeled share among Tooltrace posts only — not measured).`;
      } else if (post.views >= 500 && estimatedVisitors < 5) {
        payoffNote = "High views, low site traffic on this Tooltrace post. Check CTA and landing page.";
      } else if (post.experiment) {
        payoffNote = `Experiment: "${post.experiment}". Compare next period.`;
      }

      return {
        postId: post.id,
        title: post.title,
        platform: post.platform,
        views: post.views,
        estimatedVisitors,
        roiScore,
        payoffNote,
      };
    })
    .sort((a, b) => b.roiScore - a.roiScore)
    .slice(0, 5);
}
