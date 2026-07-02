import type { PostHighlight, PostHighlightPlatform } from "@/lib/post-highlights";
import type { HookEntry, PublishPrediction } from "./types";

function medianViews(posts: { views: number }[]): number | null {
  if (posts.length === 0) return null;
  const sorted = [...posts].map((p) => p.views).sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? null;
}

export function buildPublishPredictions(
  posts: PostHighlight[],
  hookLibrary: HookEntry[],
): PublishPrediction[] {
  if (posts.length < 2) return [];

  const predictions: PublishPrediction[] = [];

  for (const post of posts) {
    const platformPosts = posts.filter((p) => p.platform === post.platform);
    const med = medianViews(platformPosts);
    if (med === null || platformPosts.length < 2) continue;

    const hook = hookLibrary.find(
      (h) =>
        h.platform === post.platform &&
        h.appearances >= 2 &&
        post.title.toLowerCase().includes(h.hook.toLowerCase().slice(0, 12)),
    );

    const boost = hook?.status === "validated" ? 1.15 : 1;
    const viewsLow = Math.round(med * 0.5 * boost);
    const viewsHigh = Math.round(med * 1.5 * boost);

    predictions.push({
      postTitle: post.title,
      platform: post.platform,
      viewsLow,
      viewsHigh,
      basedOnPosts: platformPosts.length,
    });
  }

  return predictions;
}

export function predictDraftPost(
  title: string,
  platform: PostHighlightPlatform,
  hookLibrary: HookEntry[],
  historyPosts: PostHighlight[],
): PublishPrediction | null {
  const platformPosts = historyPosts.filter((p) => p.platform === platform);
  const med = medianViews(platformPosts);
  if (med === null || platformPosts.length < 2) return null;

  const hook = hookLibrary.find(
    (h) =>
      h.platform === platform &&
      h.appearances >= 2 &&
      title.toLowerCase().includes(h.hook.toLowerCase().slice(0, 12)),
  );
  const boost = hook?.status === "validated" ? 1.15 : 1;

  return {
    postTitle: title,
    platform,
    viewsLow: Math.round(med * 0.5 * boost),
    viewsHigh: Math.round(med * 1.5 * boost),
    basedOnPosts: platformPosts.length,
  };
}
