import type { PostHighlight, PostHighlightProduct } from "@/lib/post-highlights";

/** Which product line logged social posts target. */
export type ContentFocus = "finalrev" | "tooltrace" | "mixed" | "unknown";

function postProduct(post: PostHighlight): PostHighlightProduct {
  return post.product ?? "finalrev";
}

export function resolveContentFocus(posts: PostHighlight[]): ContentFocus {
  if (posts.length === 0) return "finalrev";

  const products = posts.map(postProduct);
  const hasTooltrace = products.some((p) => p === "tooltrace" || p === "both");
  const hasFinalrev = products.some((p) => p === "finalrev" || p === "both");

  if (hasTooltrace && hasFinalrev) return "mixed";
  if (hasTooltrace) return "tooltrace";
  return "finalrev";
}

/** Social views → Tooltrace attribution only when Tooltrace clips are in the mix. */
export function canAttributeSocialToTooltrace(focus: ContentFocus): boolean {
  return focus === "tooltrace" || focus === "mixed";
}

export function contentFocusLabel(focus: ContentFocus): string {
  switch (focus) {
    case "tooltrace":
      return "Tooltrace";
    case "mixed":
      return "finalREV + Tooltrace";
    case "finalrev":
      return "finalREV shop-floor";
    default:
      return "finalREV shop-floor";
  }
}

export function parallelTracksNote(focus: ContentFocus): string {
  if (canAttributeSocialToTooltrace(focus)) {
    return "Social and Tooltrace metrics are linked where posts target Tooltrace.";
  }
  return "finalREV social and Tooltrace site are separate tracks. Current clips are finalREV shop-floor; Tooltrace Shorts are not live yet, so social views are not attributed to Tooltrace traffic.";
}
