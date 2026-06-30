import { formatNumber } from "@/lib/utils";
import type { IntelligenceInput, PostAutopsy } from "./types";
import { aestheticSignal, shopFloorSignal } from "./context";

export function buildPostAutopsies(input: IntelligenceInput): PostAutopsy[] {
  const { posts } = input;
  if (posts.length < 2) return [];

  const medianViews = [...posts].sort((a, b) => a.views - b.views)[Math.floor(posts.length / 2)]?.views ?? 0;
  const autopsies: PostAutopsy[] = [];

  for (const post of posts) {
    if (post.views >= medianViews * 0.5) continue;

    const reasons: string[] = [];
    const fixes: string[] = [];

    if (post.views < 100) {
      reasons.push(`Only ${formatNumber(post.views)} views (bottom quartile this period)`);
    } else {
      reasons.push(`${formatNumber(post.views)} views vs median ${formatNumber(medianViews)}`);
    }

    if (post.publishedAt) {
      const day = new Date(post.publishedAt).getDay();
      if (day === 0 || day === 6) reasons.push("Posted on weekend (typically lower distribution)");
    }

    if (!post.url) reasons.push("No direct link logged");

    if (post.platform === "instagram" && post.format !== "reel") {
      reasons.push("IG post format. Reels typically get higher reach.");
      fixes.push("Re-upload as Reel with text hook on first frame");
    }

    if (aestheticSignal(post.title) && !shopFloorSignal(post.title)) {
      reasons.push("Aesthetic-style title; shop-floor posts converted better historically.");
      fixes.push("Show machine or product screen in first 3 seconds.");
    }

    if (!post.experiment) {
      reasons.push("No pinned comment / CTA experiment tagged");
      fixes.push("Tag experiment: pinned tooltrace.ai/designer link and re-post");
    }

    if (fixes.length === 0) {
      fixes.push("Test a stronger first-frame text hook and cross-post to YouTube Shorts first");
    }

    autopsies.push({
      postId: post.id,
      title: post.title,
      platform: post.platform,
      verdict: post.views < medianViews * 0.25 ? "flop" : "underperformer",
      reasons,
      fixes,
    });
  }

  return autopsies.sort((a, b) => a.verdict.localeCompare(b.verdict)).slice(0, 5);
}

export function getAutopsyForPost(autopsies: PostAutopsy[], postId: string): PostAutopsy | undefined {
  return autopsies.find((a) => a.postId === postId);
}
