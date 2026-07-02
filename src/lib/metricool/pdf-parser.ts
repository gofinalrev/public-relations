import { parse, differenceInCalendarDays, parseISO, isMonday, format } from "date-fns";
import { getWeekStart } from "@/lib/weeks";
import { SOCIAL_PLATFORMS, SOCIAL_PLATFORM_SLUGS, type SocialPlatformSlug } from "@/lib/platforms";
import type { MetricoolWeeklyMetrics, PlatformWeeklyStats } from "./metrics";
import {
  aggregateXFromPosts,
  isXCommunityGrowthPage,
  parseAllPdfPosts,
  parseXCommunityGrowth,
  type ParsedPdfPost,
} from "./pdf-post-parser";

export type ParsedMetricoolPdf = {
  brand: string;
  periodStart: string;
  periodEnd: string;
  weekStart: string;
  periodLabel: string;
  sourceFilename: string;
  metrics: MetricoolWeeklyMetrics;
  extras: {
    pageViews: number;
    youtubeSubsGained: number;
    youtubeSubscribers: number;
    totalFollowers: number;
    linkedinClicks: number;
    linkedinReactions: number;
    linkedinComments: number;
    linkedinShares: number;
  };
  periodDays: number;
  parsedPosts: ParsedPdfPost[];
};

function parseNum(raw: string): number {
  const n = parseFloat(raw.replace(/,/g, "").replace("%", ""));
  return Number.isFinite(n) ? n : 0;
}

function parseMetricoolDate(raw: string): Date {
  const d = parse(raw.trim(), "dd MMM yy", new Date());
  if (!Number.isNaN(d.getTime())) return d;
  throw new Error(`Could not parse date: ${raw}`);
}

export function parseDateRange(text: string): { start: Date; end: Date; label: string } {
  const match = text.match(
    /(\d{1,2}\s+[A-Za-z]{3}\s+\d{2})\s*[-–]\s*(\d{1,2}\s+[A-Za-z]{3}\s+\d{2})/,
  );
  if (!match) throw new Error("Could not find report date range in PDF");
  return {
    start: parseMetricoolDate(match[1]),
    end: parseMetricoolDate(match[2]),
    label: `${match[1]} – ${match[2]}`,
  };
}

function splitPages(text: string): string[] {
  return text
    .split(/-- \d+ of \d+ --/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function pageTitle(page: string): string {
  const lines = page
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const brandIdx = lines.findIndex((l) => /^(finalREV|gofinalrev)$/i.test(l));
  if (brandIdx > 0) return lines[brandIdx - 1].toLowerCase();
  return lines[lines.length - 1]?.toLowerCase() ?? "";
}

function parsePlatformValues(page: string): Partial<Record<SocialPlatformSlug, number>> {
  const out: Partial<Record<SocialPlatformSlug, number>> = {};

  for (const slug of SOCIAL_PLATFORM_SLUGS) {
    const labels = SOCIAL_PLATFORMS[slug].pdfLabels;
    for (const label of labels) {
      const re = new RegExp(`${label}\\s*\\n\\s*([+-]?[\\d,]+(?:\\.\\d+)?)`, "i");
      const m = page.match(re);
      if (m) {
        out[slug] = parseNum(m[1]);
        break;
      }
    }
  }

  // Metricool rollup uses "Twitter" for X
  if (out.x === undefined) {
    const tw = page.match(/Twitter\s*\n\s*([+-]?[\d,]+(?:\.\d+)?)/i);
    if (tw) out.x = parseNum(tw[1]);
  }

  return out;
}

function parseHeaderTotal(page: string): number {
  const m = page.match(/(?:^|\n)\s*([+-]?[\d,]+(?:\.\d+)?)\s*\n\s*[+-]?[\d.]+%/);
  return m ? parseNum(m[1]) : 0;
}

function parseLabeledValue(page: string, label: string): number {
  const re = new RegExp(`${label}\\s*\\n\\s*([+-]?[\\d,]+(?:\\.\\d+)?)`, "i");
  const m = page.match(re);
  return m ? parseNum(m[1]) : 0;
}

function parseFilenameDate(filename: string): string | null {
  const m = filename.match(/-(\d{8})-/);
  if (!m) return null;
  const raw = m[1];
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

/** Map PDF to a Monday week key — prefer period end, not raw filename date */
export function resolveWeekStart(
  periodStart: Date,
  periodEnd: Date,
  sourceFilename: string,
  override?: string | null,
): string {
  if (override) return override;
  const filenameDate = parseFilenameDate(sourceFilename);
  if (filenameDate) {
    const fd = parseISO(filenameDate);
    if (isMonday(fd)) return filenameDate;
  }
  return format(getWeekStart(periodEnd), "yyyy-MM-dd");
}

function buildPlatformStat(
  slug: SocialPlatformSlug,
  followers: Partial<Record<SocialPlatformSlug, number>>,
  impressions: Partial<Record<SocialPlatformSlug, number>>,
  extras: {
    youtubeVideoViews: number;
    youtubeSubscribers: number;
    linkedinImpressions: number;
    linkedinClicks: number;
    linkedinReactions: number;
    linkedinComments: number;
    linkedinShares: number;
    linkedinFollowers: number;
    xFollowers: number;
    xImpressions: number;
    xEngagement: number;
    xVideoViews: number;
    xPosts: number;
  },
): PlatformWeeklyStats {
  const meta = SOCIAL_PLATFORMS[slug];
  const followerCount =
    slug === "youtube"
      ? extras.youtubeSubscribers || followers.youtube || 0
      : slug === "linkedin"
        ? followers.linkedin || extras.linkedinFollowers || 0
        : slug === "x"
          ? extras.xFollowers || followers.x || 0
          : followers[slug] ?? 0;
  const impressionCount =
    slug === "linkedin"
      ? extras.linkedinImpressions || impressions.linkedin || 0
      : slug === "youtube"
        ? impressions.youtube ?? 0
        : slug === "x"
          ? extras.xImpressions || impressions.x || 0
          : impressions[slug] ?? 0;

  const videoViews =
    slug === "youtube"
      ? extras.youtubeVideoViews
      : slug === "x"
        ? extras.xVideoViews
        : 0;

  const linkedinInteractions =
    extras.linkedinReactions + extras.linkedinComments + extras.linkedinShares + extras.linkedinClicks;

  const engagement =
    slug === "linkedin"
      ? linkedinInteractions
      : slug === "x"
        ? extras.xEngagement
        : 0;

  return {
    platform: slug,
    name: meta.name,
    url: meta.url,
    handle: meta.handle,
    followers: followerCount,
    videoViews,
    engagement,
    impressions: impressionCount,
    posts: slug === "x" ? extras.xPosts : 0,
  };
}

export function parseMetricoolPdfText(text: string, sourceFilename: string): ParsedMetricoolPdf {
  const { start, end, label: periodLabel } = parseDateRange(text);
  const periodDays = differenceInCalendarDays(end, start) + 1;
  const weekStart = resolveWeekStart(start, end, sourceFilename);

  const pages = splitPages(text);

  let totalFollowers = 0;
  let totalImpressions = 0;
  let followerPlatforms: Partial<Record<SocialPlatformSlug, number>> = {};
  let impressionPlatforms: Partial<Record<SocialPlatformSlug, number>> = {};
  let linkedinFollowers = 0;
  let linkedinImpressions = 0;
  let linkedinClicks = 0;
  let linkedinReactions = 0;
  let linkedinComments = 0;
  let linkedinShares = 0;
  let youtubeVideoViews = 0;
  let youtubeSubsGained = 0;
  let youtubeSubscribers = 0;
  let pageViews = 0;
  let xFollowers = 0;
  let xPostsCount = 0;

  for (const page of pages) {
    const title = pageTitle(page);

    if (title === "followers" && page.includes("Instagram")) {
      totalFollowers = parseHeaderTotal(page);
      followerPlatforms = parsePlatformValues(page);
    } else if (title === "impressions" && page.includes("Instagram")) {
      totalImpressions = parseHeaderTotal(page);
      impressionPlatforms = parsePlatformValues(page);
    } else if (title.includes("community growth") && page.includes("Paid followers")) {
      linkedinFollowers = parseLabeledValue(page, "Followers");
    } else if (title.includes("page views")) {
      pageViews = parseLabeledValue(page, "Page views");
    } else if (title.includes("content viewed")) {
      linkedinImpressions = parseLabeledValue(page, "Impressions");
      linkedinReactions = parseLabeledValue(page, "Reactions");
      linkedinComments = parseLabeledValue(page, "Comments");
      linkedinShares = parseLabeledValue(page, "Shares");
      linkedinClicks = parseLabeledValue(page, "Clicks");
    } else if (title.includes("community growth") && page.includes("Subscribers")) {
      youtubeSubscribers = parseLabeledValue(page, "Subscribers");
      youtubeSubsGained = parseLabeledValue(page, "Gained");
    } else if (title.includes("video views") && page.includes("Video views")) {
      youtubeVideoViews = parseLabeledValue(page, "Video views");
    } else if (isXCommunityGrowthPage(page)) {
      const xGrowth = parseXCommunityGrowth(page);
      if (xGrowth.followers > 0) xFollowers = xGrowth.followers;
      if (xGrowth.posts > 0) xPostsCount = xGrowth.posts;
    }
  }

  const parsedPosts = parseAllPdfPosts(pages);
  const xAgg = aggregateXFromPosts(parsedPosts);
  if (xFollowers > 0) followerPlatforms.x = xFollowers;

  if (!totalFollowers) {
    totalFollowers =
      linkedinFollowers ||
      followerPlatforms.linkedin ||
      SOCIAL_PLATFORM_SLUGS.reduce((s, k) => s + (followerPlatforms[k] ?? 0), 0);
  }

  if (!totalImpressions) {
    totalImpressions = SOCIAL_PLATFORM_SLUGS.reduce((s, k) => s + (impressionPlatforms[k] ?? 0), 0);
  }

  const platformExtras = {
    youtubeVideoViews,
    youtubeSubscribers,
    linkedinImpressions,
    linkedinClicks,
    linkedinReactions,
    linkedinComments,
    linkedinShares,
    linkedinFollowers,
    xFollowers,
    xImpressions: xAgg.impressions,
    xEngagement: xAgg.engagement,
    xVideoViews: xAgg.videoViews,
    xPosts: xPostsCount || parsedPosts.filter((p) => p.platform === "x").length,
  };

  const platformStats = SOCIAL_PLATFORM_SLUGS.map((slug) =>
    buildPlatformStat(slug, followerPlatforms, impressionPlatforms, platformExtras),
  );

  const totalVideoViews = platformStats.reduce((s, p) => s + p.videoViews, 0);
  const totalEngagement = platformStats.reduce((s, p) => {
    if (p.platform === "linkedin") return s + p.engagement;
    if (p.platform === "youtube") return s + p.videoViews;
    if (p.platform === "x") return s + (p.impressions > 0 ? p.impressions : p.videoViews);
    return s + p.impressions;
  }, 0);

  const metrics: MetricoolWeeklyMetrics = {
    weekStart,
    weekEnd: end.toISOString().slice(0, 10),
    periodStart: start.toISOString().slice(0, 10),
    periodEnd: end.toISOString().slice(0, 10),
    periodDays,
    totalVideoViews,
    totalEngagement,
    platforms: platformStats,
    fetchedAt: new Date().toISOString(),
  };

  return {
    brand: "gofinalrev",
    periodStart: start.toISOString().slice(0, 10),
    periodEnd: end.toISOString().slice(0, 10),
    weekStart,
    periodLabel,
    sourceFilename,
    metrics,
    extras: {
      pageViews,
      youtubeSubsGained,
      youtubeSubscribers,
      totalFollowers,
      linkedinClicks,
      linkedinReactions,
      linkedinComments,
      linkedinShares,
    },
    periodDays,
    parsedPosts,
  };
}

export async function extractPdfText(buffer: Buffer): Promise<string> {
  // pdfjs-dist needs browser APIs; @napi-rs/canvas polyfills them in Node/serverless
  await import("@napi-rs/canvas");
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text ?? "";
  } finally {
    await parser.destroy();
  }
}

export async function parseMetricoolPdfBuffer(
  buffer: Buffer,
  sourceFilename: string,
): Promise<ParsedMetricoolPdf> {
  const text = await extractPdfText(buffer);
  if (!text.trim()) throw new Error("PDF contained no extractable text");
  return parseMetricoolPdfText(text, sourceFilename);
}
