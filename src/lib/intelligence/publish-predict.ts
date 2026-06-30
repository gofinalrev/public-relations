import type { PostHighlight, PostHighlightPlatform } from "@/lib/post-highlights";
import type { HookEntry, PublishPrediction } from "./types";
import { aestheticSignal, shopFloorSignal } from "./context";
import { canAttributeSocialToTooltrace, resolveContentFocus } from "./content-focus";

export function buildPublishPredictions(
  posts: PostHighlight[],
  hookLibrary: HookEntry[],
): PublishPrediction[] {
  const platformMedians = new Map<PostHighlightPlatform, number>();

  for (const post of posts) {
    const list = platformMedians.get(post.platform) ?? 0;
    platformMedians.set(post.platform, Math.max(list, post.views));
  }

  const defaults: Partial<Record<PostHighlightPlatform, number>> = {
    youtube: 1500,
    instagram: 400,
    tiktok: 600,
    x: 300,
    linkedin: 200,
  };

  const linked = canAttributeSocialToTooltrace(resolveContentFocus(posts));

  return posts.map((post) => {
    const median = platformMedians.get(post.platform) || defaults[post.platform] || 500;
    const hook = hookLibrary.find(
      (h) => h.platform === post.platform && post.title.toLowerCase().includes(h.hook.toLowerCase().slice(0, 12)),
    );

    const shop = shopFloorSignal(post.title);
    const aesthetic = aestheticSignal(post.title);
    let tooltracePotential: PublishPrediction["tooltracePotential"] = linked ? "medium" : "low";
    if (linked && shop) tooltracePotential = "high";
    if (linked && aesthetic && !shop) tooltracePotential = "low";
    if (post.product === "tooltrace" || post.product === "both") tooltracePotential = "high";
    if (post.product === "finalrev") tooltracePotential = "low";

    const boost = hook?.status === "validated" ? 1.3 : 1;
    const viewsLow = Math.round(median * 0.4 * boost);
    const viewsHigh = Math.round(median * 1.8 * boost);

    let igUnless: string | null = null;
    if (post.platform === "instagram" || post.platform === "youtube") {
      igUnless = "IG estimate assumes native cover text in first 2 seconds.";
    }

    return {
      postTitle: post.title,
      platform: post.platform,
      viewsLow,
      viewsHigh,
      tooltracePotential,
      igUnless: post.platform === "youtube" ? igUnless : null,
      confidence: hook ? 0.72 : posts.length >= 3 ? 0.55 : 0.35,
    };
  });
}

export function predictDraftPost(
  title: string,
  platform: PostHighlightPlatform,
  hookLibrary: HookEntry[],
  historyPosts: PostHighlight[],
): PublishPrediction {
  return buildPublishPredictions(
    [...historyPosts, { id: "draft", platform, title, views: 0, likes: 0 }],
    hookLibrary,
  ).slice(-1)[0]!;
}
