import { formatNumber } from "@/lib/utils";
import type { IntelligenceInput, PostAutopsy } from "./types";
import { aestheticSignal, shopFloorSignal } from "./context";

export function buildPostAutopsies(input: IntelligenceInput): PostAutopsy[] {
  const { posts } = input;
  if (posts.length < 3) return [];

  const sorted = [...posts].sort((a, b) => a.views - b.views);
  const medianViews = sorted[Math.floor(sorted.length / 2)]?.views ?? 0;
  const shopPosts = posts.filter((p) => shopFloorSignal(p.title));
  const aestheticPosts = posts.filter((p) => aestheticSignal(p.title));
  const shopAvg =
    shopPosts.length > 0 ? shopPosts.reduce((s, p) => s + p.views, 0) / shopPosts.length : null;
  const aestheticAvg =
    aestheticPosts.length > 0
      ? aestheticPosts.reduce((s, p) => s + p.views, 0) / aestheticPosts.length
      : null;

  const autopsies: PostAutopsy[] = [];

  for (const post of posts) {
    if (post.views >= medianViews * 0.5) continue;

    const reasons: string[] = [];
    const fixes: string[] = [];

    reasons.push(
      `${formatNumber(post.views)} views — below the ${formatNumber(medianViews)} median for ${posts.length} logged posts this period`,
    );

    if (!post.url) reasons.push("No post URL logged");

    if (post.platform === "instagram" && post.format && post.format !== "reel") {
      reasons.push(`Logged as ${post.format}, not reel`);
      fixes.push("If this was a Reel, update the format tag");
    }

    if (
      aestheticSignal(post.title) &&
      !shopFloorSignal(post.title) &&
      shopAvg !== null &&
      aestheticAvg !== null &&
      shopPosts.length >= 2 &&
      aestheticPosts.length >= 1 &&
      shopAvg > aestheticAvg * 1.3
    ) {
      reasons.push(
        `Shop-floor posts averaged ${formatNumber(Math.round(shopAvg))} views this period vs ${formatNumber(Math.round(aestheticAvg))} on aesthetic edits`,
      );
      fixes.push("Try shop-floor or CNC footage in the opening frame");
    }

    if (!post.experiment) {
      reasons.push("No experiment tag (e.g. pinned link test)");
    }

    if (fixes.length === 0) {
      fixes.push("Compare hooks with your top post this period and cross-post to the stronger platform first");
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
