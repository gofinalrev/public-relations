import { parse, format } from "date-fns";
import type { PostHighlightPlatform } from "@/lib/post-highlights";

export type ParsedPdfPost = {
  platform: PostHighlightPlatform;
  title: string;
  publishedAt?: string;
  /** Impressions or video views — whatever Metricool reports for the post */
  views: number;
  likes: number;
  format?: "short" | "video" | "post";
};

function parseNum(raw: string): number {
  const n = parseFloat(raw.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function parsePostDate(raw: string): string | undefined {
  try {
    const d = parse(raw.trim(), "MMM d, yyyy", new Date());
    if (!Number.isNaN(d.getTime())) return format(d, "yyyy-MM-dd");
  } catch {
    /* ignore */
  }
  return undefined;
}

function cleanTitle(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .replace(/\.\.\.$/, "")
    .replace(/Go\s*$/, "")
    .trim();
}

function postKey(post: ParsedPdfPost): string {
  const words = post.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)
    .join(" ");
  return `${post.platform}:${post.publishedAt ?? ""}:${words}`;
}

function isValidPdfPost(post: ParsedPdfPost): boolean {
  if (post.views < 10 || post.title.length < 12) return false;
  if (/\bGo\s+\d/.test(post.title) || /Time watched/i.test(post.title)) return false;
  return true;
}

export function dedupePdfPosts(posts: ParsedPdfPost[]): ParsedPdfPost[] {
  const byKey = new Map<string, ParsedPdfPost>();
  for (const post of posts.filter(isValidPdfPost)) {
    const key = postKey(post);
    const existing = byKey.get(key);
    if (!existing || post.views > existing.views || post.likes > existing.likes) {
      byKey.set(key, post);
    }
  }
  return [...byKey.values()].sort((a, b) => b.views - a.views);
}

/** X community growth page: Followers + Acquired + Lost + Posts (not YouTube Subscribers). */
export function isXCommunityGrowthPage(page: string): boolean {
  return (
    /Community growth/i.test(page) &&
    /\bAcquired\b/i.test(page) &&
    /\bLost\b/i.test(page) &&
    /\bPosts\b/i.test(page) &&
    !/Subscribers/i.test(page) &&
    !/Total content/i.test(page)
  );
}

export function parseXCommunityGrowth(page: string): {
  followers: number;
  posts: number;
  acquired: number;
  lost: number;
} {
  const read = (label: string) => {
    const re = new RegExp(`${label}\\s*\\n\\s*([+-]?[\\d,]+)`, "i");
    const m = page.match(re);
    return m ? parseNum(m[1]) : 0;
  };
  return {
    followers: read("Followers"),
    posts: read("Posts"),
    acquired: read("Acquired"),
    lost: read("Lost"),
  };
}

function isLinkedInRanking(page: string): boolean {
  const flat = page.replace(/\s+/g, " ");
  return /Reactions\s+Comments\s+Impressions\s+Clicks/i.test(flat) || /Viewers\s+Time watched/i.test(flat);
}

function isInstagramReelRanking(page: string): boolean {
  return /Views\s*\n\s*Reach\s*\n\s*Likes/i.test(page.replace(/\s+/g, " "));
}

function isYouTubeVideoRanking(page: string): boolean {
  return /Video views\s*\n\s*Watch time/i.test(page.replace(/\s+/g, " "));
}

/** X table with Reposts + Profile clicks + Video views columns. */
export function isXDetailedRankingPage(page: string): boolean {
  return /Reposts/i.test(page) && /Profile clicks/i.test(page) && /Video views/i.test(page);
}

/** Brand / X posts: Impressions + Interactions columns, rows ending in Go N N. */
export function isImpressionsInteractionsRankingPage(page: string): boolean {
  if (isLinkedInRanking(page) || isInstagramReelRanking(page) || isYouTubeVideoRanking(page)) {
    return false;
  }
  if (/Impressions\s+Interactions/i.test(page)) return true;
  if (/Ranking of posts/i.test(page) && /\bGo\s+\d+\s+\d+/i.test(page)) {
    return !isXDetailedRankingPage(page);
  }
  return false;
}

/** Parse `Go impressions interactions` rows (Metricool cross-post ranking). */
export function parseImpressionsInteractionsPosts(page: string): ParsedPdfPost[] {
  const posts: ParsedPdfPost[] = [];
  const re =
    /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}, \d{4})\s*\n\s*(?:\d{1,2}:\d{2} [AP]M\s*\n)?([\s\S]*?)\bGo\s+(\d[\d,]*)\s+(\d[\d,]*)/gi;

  for (const match of page.matchAll(re)) {
    const title = cleanTitle(match[2] ?? "");
    if (title.length < 8) continue;
    posts.push({
      platform: "x",
      title,
      publishedAt: parsePostDate(match[1] ?? ""),
      views: parseNum(match[3] ?? "0"),
      likes: parseNum(match[4] ?? "0"),
      format: "short",
    });
  }

  return posts;
}

/** Parse X rows with video view column: Go imp likes reposts ... videoViews */
export function parseXDetailedPosts(page: string): ParsedPdfPost[] {
  const posts: ParsedPdfPost[] = [];
  const re =
    /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}, \d{4})\s*\n\s*(?:\d{1,2}:\d{2} [AP]M\s*\n)?([\s\S]*?)\bGo\s+(\d[\d,]*)\s+(\d[\d,]*)\s+([-\d][\d,]*(?:\.\d+)?(?:\s+[-\d][\d,]*(?:\.\d+)?)*)\s+(\d[\d,]*|-)/gi;

  for (const match of page.matchAll(re)) {
    const title = cleanTitle(match[2] ?? "");
    if (title.length < 8) continue;
    const impressions = parseNum(match[3] ?? "0");
    const likes = parseNum(match[4] ?? "0");
    const videoRaw = match[6] ?? "-";
    const videoViews = videoRaw.trim() === "-" ? 0 : parseNum(videoRaw);
    posts.push({
      platform: "x",
      title,
      publishedAt: parsePostDate(match[1] ?? ""),
      views: videoViews > 0 ? videoViews : impressions,
      likes,
      format: videoViews > 0 ? "video" : "short",
    });
  }

  return posts;
}

export function parseAllPdfPosts(pages: string[]): ParsedPdfPost[] {
  const collected: ParsedPdfPost[] = [];

  for (const page of pages) {
    if (isXDetailedRankingPage(page)) {
      collected.push(...parseXDetailedPosts(page));
    } else if (isImpressionsInteractionsRankingPage(page)) {
      collected.push(...parseImpressionsInteractionsPosts(page));
    }
  }

  return dedupePdfPosts(collected);
}

export function aggregateXFromPosts(posts: ParsedPdfPost[]): {
  impressions: number;
  engagement: number;
  videoViews: number;
} {
  let impressions = 0;
  let engagement = 0;
  let videoViews = 0;

  for (const post of posts.filter((p) => p.platform === "x")) {
    impressions += post.views;
    engagement += post.likes;
    if (post.format === "video") videoViews += post.views;
  }

  return { impressions, engagement, videoViews };
}
