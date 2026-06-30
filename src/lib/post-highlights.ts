import { formatNumber } from "@/lib/utils";

export type PostHighlightPlatform = "youtube" | "instagram" | "x" | "linkedin" | "tiktok" | "facebook" | "other";
export type PostHighlightFormat = "short" | "reel" | "post" | "carousel" | "video";
export type PostHighlightProduct = "finalrev" | "tooltrace" | "both";

export type PostHighlight = {
  id: string;
  platform: PostHighlightPlatform;
  format?: PostHighlightFormat;
  title: string;
  views: number;
  likes: number;
  /** ISO date YYYY-MM-DD */
  publishedAt?: string;
  product?: PostHighlightProduct;
  notes?: string;
  /** Links cross-posts, e.g. same short on YT + IG */
  groupId?: string;
};

export type PostHighlightInsight = {
  type: "success" | "info" | "warning";
  title: string;
  body: string;
};

export function parsePostHighlights(raw: string | null | undefined): PostHighlight[] {
  if (!raw?.trim()) return [];
  try {
    const data = JSON.parse(raw) as { posts?: PostHighlight[] } | PostHighlight[];
    const posts = Array.isArray(data) ? data : data.posts;
    if (!Array.isArray(posts)) return [];
    return posts.filter((p) => p.title && Number.isFinite(p.views));
  } catch {
    return [];
  }
}

export function serializePostHighlights(posts: PostHighlight[]): string {
  return JSON.stringify({ posts, updatedAt: new Date().toISOString() });
}

function likeRate(post: PostHighlight): number | null {
  if (post.views <= 0) return null;
  return (post.likes / post.views) * 100;
}

function daysAgo(isoDate: string | undefined): number | null {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, Math.round((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)));
}

export function analyzePostHighlights(posts: PostHighlight[]): PostHighlightInsight[] {
  if (posts.length === 0) return [];

  const insights: PostHighlightInsight[] = [];
  const sorted = [...posts].sort((a, b) => b.views - a.views);
  const top = sorted[0];

  insights.push({
    type: "success",
    title: `Top post: ${top.title}`,
    body: `${formatNumber(top.views)} views on ${platformLabel(top.platform)}${top.format ? ` (${top.format})` : ""}${top.publishedAt ? ` · ${top.publishedAt}` : ""}.`,
  });

  const groups = new Map<string, PostHighlight[]>();
  for (const p of posts) {
    if (!p.groupId) continue;
    const list = groups.get(p.groupId) ?? [];
    list.push(p);
    groups.set(p.groupId, list);
  }

  for (const [, group] of groups) {
    if (group.length < 2) continue;
    const byViews = [...group].sort((a, b) => b.views - a.views);
    const best = byViews[0];
    const rest = byViews.slice(1);
    const restViews = rest.reduce((s, p) => s + p.views, 0);
    if (best.views > restViews * 2 && best.views >= 100) {
      insights.push({
        type: "info",
        title: "Cross-platform gap on same clip",
        body: `"${best.title}" — ${formatNumber(best.views)} on ${platformLabel(best.platform)} vs ${rest.map((p) => `${formatNumber(p.views)} on ${platformLabel(p.platform)}`).join(", ")}. Lead with the winning platform, then adapt hook/caption for the laggard.`,
      });
    }
  }

  const igReels = posts.filter((p) => p.platform === "instagram" && p.format === "reel");
  if (igReels.length >= 2) {
    const byEngagement = [...igReels].sort((a, b) => (likeRate(b) ?? 0) - (likeRate(a) ?? 0));
    const bestEng = byEngagement[0];
    const rate = likeRate(bestEng);
    if (rate !== null && rate >= 2) {
      insights.push({
        type: "success",
        title: "Best IG Reel engagement",
        body: `"${bestEng.title}" — ${rate.toFixed(1)}% like rate (${bestEng.likes}/${formatNumber(bestEng.views)}). Reuse this hook style on shop-floor reels.`,
      });
    }
    const weakest = [...igReels].sort((a, b) => a.views - b.views)[0];
    if (weakest.views < bestEng.views / 2 && weakest.id !== bestEng.id) {
      insights.push({
        type: "warning",
        title: "IG reel underperformed",
        body: `"${weakest.title}" — ${formatNumber(weakest.views)} views. Person/machine intros may need a stronger first frame or text hook before the payoff.`,
      });
    }
  }

  const ytShorts = posts.filter((p) => p.platform === "youtube" && p.format === "short");
  if (ytShorts.length > 0 && igReels.length > 0) {
    const ytTotal = ytShorts.reduce((s, p) => s + p.views, 0);
    const igTotal = igReels.reduce((s, p) => s + p.views, 0);
    if (ytTotal > igTotal * 1.5) {
      insights.push({
        type: "info",
        title: "YouTube Shorts outpacing IG Reels",
        body: `${formatNumber(ytTotal)} Short views vs ${formatNumber(igTotal)} Reel views this week. Shop-floor CNC content may be finding audience on YouTube first — prioritize Shorts upload, then repurpose with IG-native cover text.`,
      });
    }
  }

  const recent = sorted.filter((p) => {
    const age = daysAgo(p.publishedAt);
    return age !== null && age <= 3 && p.views >= 500;
  });
  if (recent.length > 0) {
    insights.push({
      type: "success",
      title: "Fresh momentum",
      body: `${recent.map((p) => `"${p.title}" (${formatNumber(p.views)})`).join(" · ")} — still climbing. Pin comment with finalrev.com/quote or tooltrace CTA while traffic is warm.`,
    });
  }

  return insights.slice(0, 5);
}

export function platformLabel(platform: PostHighlightPlatform): string {
  const labels: Record<PostHighlightPlatform, string> = {
    youtube: "YouTube",
    instagram: "Instagram",
    x: "X",
    linkedin: "LinkedIn",
    tiktok: "TikTok",
    facebook: "Facebook",
    other: "Other",
  };
  return labels[platform];
}

export function totalHighlightViews(posts: PostHighlight[]): number {
  return posts.reduce((s, p) => s + p.views, 0);
}
