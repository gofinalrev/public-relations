import type { PostHighlight, PostHighlightPlatform } from "@/lib/post-highlights";
import { SOCIAL_PLATFORMS } from "@/lib/platforms";

type KnownPlatform = keyof typeof SOCIAL_PLATFORMS;

function platformMeta(platform: PostHighlightPlatform) {
  if (platform === "other") return null;
  if (!(platform in SOCIAL_PLATFORMS)) return null;
  return SOCIAL_PLATFORMS[platform as KnownPlatform];
}

/** Best-effort link to the post on the native platform (direct URL or search/profile fallback). */
export function resolvePostUrl(post: PostHighlight): string | null {
  const direct = post.url?.trim();
  if (direct) {
    return direct.startsWith("http") ? direct : `https://${direct}`;
  }

  const profile = platformMeta(post.platform);
  if (!profile) return null;
  const q = encodeURIComponent(post.title);

  switch (post.platform) {
    case "youtube":
      return `https://www.youtube.com/@gofinalrev/search?query=${q}`;
    case "x":
      return `https://x.com/search?q=from%3Agofinalrev%20${q}&src=typed_query`;
    case "instagram":
      return `https://www.instagram.com/gofinalrev/`;
    case "tiktok":
      return `https://www.tiktok.com/@gofinalrev`;
    case "linkedin":
      return `https://www.linkedin.com/company/finalrev/posts/?feedView=all`;
    case "facebook":
      return profile.url;
    default:
      return profile.url;
  }
}
