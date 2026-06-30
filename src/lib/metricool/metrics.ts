import { endOfWeek, parseISO, format } from "date-fns";
import { PLATFORM_PROFILES } from "./config";
import {
  fetchTimelineLatest,
  fetchTimelineMetric,
  fetchV2Timeline,
  fetchV2TimelineLatest,
} from "./client";

export type PlatformWeeklyStats = {
  platform: string;
  name: string;
  url: string;
  handle: string;
  followers: number;
  videoViews: number;
  engagement: number;
  impressions: number;
  posts: number;
};

export type MetricoolWeeklyMetrics = {
  weekStart: string;
  weekEnd: string;
  periodStart?: string;
  periodEnd?: string;
  periodDays?: number;
  totalVideoViews: number;
  totalEngagement: number;
  platforms: PlatformWeeklyStats[];
  fetchedAt: string;
};

function weekDates(weekStart: string) {
  const start = parseISO(weekStart);
  const end = endOfWeek(start, { weekStartsOn: 1 });
  return {
    startYmd: format(start, "yyyyMMdd"),
    endYmd: format(end, "yyyyMMdd"),
    fromIso: `${format(start, "yyyy-MM-dd")}T00:00:00-08:00`,
    toIso: `${format(end, "yyyy-MM-dd")}T23:59:59-08:00`,
  };
}

async function fetchYouTubeStats(dates: ReturnType<typeof weekDates>): Promise<PlatformWeeklyStats> {
  const p = PLATFORM_PROFILES.youtube;
  const [followers, videoViews, engagement, ytViewsLegacy] = await Promise.all([
    fetchTimelineLatest("yttotalSubscribers", dates.startYmd, dates.endYmd).catch(() => 0),
    fetchV2Timeline({
      network: "youtube",
      metric: "views",
      from: dates.fromIso,
      to: dates.toIso,
    }).catch(() => 0),
    fetchV2Timeline({
      network: "youtube",
      metric: "interactions",
      from: dates.fromIso,
      to: dates.toIso,
    }).catch(() => 0),
    fetchTimelineMetric("ytviews", dates.startYmd, dates.endYmd).catch(() => 0),
  ]);

  return {
    platform: "youtube",
    name: p.name,
    url: p.url,
    handle: p.handle,
    followers,
    videoViews: videoViews || ytViewsLegacy,
    engagement,
    impressions: 0,
    posts: 0,
  };
}

async function fetchXStats(dates: ReturnType<typeof weekDates>): Promise<PlatformWeeklyStats> {
  const p = PLATFORM_PROFILES.x;
  const [followers, retweets, favorites, mentions] = await Promise.all([
    fetchTimelineLatest("twitterFollowers", dates.startYmd, dates.endYmd).catch(() => 0),
    fetchTimelineMetric("twRetweets", dates.startYmd, dates.endYmd).catch(() => 0),
    fetchTimelineMetric("twFavorites", dates.startYmd, dates.endYmd).catch(() => 0),
    fetchTimelineMetric("twMentions", dates.startYmd, dates.endYmd).catch(() => 0),
  ]);

  return {
    platform: "x",
    name: p.name,
    url: p.url,
    handle: p.handle,
    followers,
    videoViews: 0,
    engagement: retweets + favorites + mentions,
    impressions: 0,
    posts: 0,
  };
}

async function fetchInstagramStats(dates: ReturnType<typeof weekDates>): Promise<PlatformWeeklyStats> {
  const p = PLATFORM_PROFILES.instagram;
  const [followers, reelViews, engagement, impressions] = await Promise.all([
    fetchTimelineLatest("igFollowers", dates.startYmd, dates.endYmd).catch(() => 0),
    fetchV2Timeline({
      network: "instagram",
      metric: "videoviews",
      from: dates.fromIso,
      to: dates.toIso,
      subject: "reels",
    }).catch(() => 0),
    fetchV2Timeline({
      network: "instagram",
      metric: "interactions",
      from: dates.fromIso,
      to: dates.toIso,
      subject: "reels",
    }).catch(() =>
      fetchTimelineMetric("igInteractions", dates.startYmd, dates.endYmd).catch(() => 0),
    ),
    fetchV2Timeline({
      network: "instagram",
      metric: "reach",
      from: dates.fromIso,
      to: dates.toIso,
      subject: "reels",
    }).catch(() => 0),
  ]);

  return {
    platform: "instagram",
    name: p.name,
    url: p.url,
    handle: p.handle,
    followers,
    videoViews: reelViews,
    engagement,
    impressions,
    posts: 0,
  };
}

async function fetchLinkedInStats(dates: ReturnType<typeof weekDates>): Promise<PlatformWeeklyStats> {
  const p = PLATFORM_PROFILES.linkedin;
  const [followers, impressions, engagement] = await Promise.all([
    fetchV2TimelineLatest({
      network: "linkedin",
      metric: "followers",
      from: dates.fromIso,
      to: dates.toIso,
    }).catch(() => fetchTimelineLatest("inFollowers", dates.startYmd, dates.endYmd).catch(() => 0)),
    fetchV2Timeline({
      network: "linkedin",
      metric: "impressions",
      from: dates.fromIso,
      to: dates.toIso,
      subject: "posts",
    }).catch(() => fetchTimelineMetric("inCompanyImpressions", dates.startYmd, dates.endYmd).catch(() => 0)),
    fetchV2Timeline({
      network: "linkedin",
      metric: "interactions",
      from: dates.fromIso,
      to: dates.toIso,
      subject: "posts",
    }).catch(() => 0),
  ]);

  return {
    platform: "linkedin",
    name: p.name,
    url: p.url,
    handle: p.handle,
    followers,
    videoViews: 0,
    engagement,
    impressions,
    posts: 0,
  };
}

export async function fetchWeeklyMetricoolMetrics(weekStart: string): Promise<MetricoolWeeklyMetrics> {
  const dates = weekDates(weekStart);

  const platforms = await Promise.all([
    fetchYouTubeStats(dates),
    fetchXStats(dates),
    fetchInstagramStats(dates),
    fetchLinkedInStats(dates),
  ]);

  const totalVideoViews = platforms.reduce((s, p) => s + p.videoViews, 0);
  const totalEngagement = platforms.reduce((s, p) => s + p.engagement, 0);

  return {
    weekStart,
    weekEnd: dates.endYmd,
    totalVideoViews,
    totalEngagement,
    platforms,
    fetchedAt: new Date().toISOString(),
  };
}
