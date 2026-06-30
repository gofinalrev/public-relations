export const METRICOOL_CONFIG = {
  baseUrl: "https://app.metricool.com/api",
  userToken: process.env.METRICOOL_USER_TOKEN ?? "",
  userId: process.env.METRICOOL_USER_ID ?? "",
  blogId: process.env.METRICOOL_BLOG_ID ?? "",
  timezone: process.env.METRICOOL_TIMEZONE ?? "America/Los_Angeles",
};

export function isMetricoolConfigured(): boolean {
  const { userToken, userId, blogId } = METRICOOL_CONFIG;
  return Boolean(userToken && userId && blogId);
}

/** Vital metrics we pull per platform — maps to Metricool API metric names */
export const PLATFORM_PROFILES = {
  youtube: {
    slug: "youtube",
    name: "YouTube",
    handle: "@gofinalrev",
    url: "https://www.youtube.com/@gofinalrev",
    followerMetric: "yttotalSubscribers",
    v2Network: "youtube",
    viewMetric: "views",
    engagementMetric: "interactions",
  },
  x: {
    slug: "x",
    name: "X",
    handle: "@gofinalrev",
    url: "https://x.com/gofinalrev",
    followerMetric: "twitterFollowers",
    engagementMetrics: ["twRetweets", "twFavorites", "twMentions"],
  },
  instagram: {
    slug: "instagram",
    name: "Instagram",
    handle: "@gofinalrev",
    url: "https://instagram.com/gofinalrev",
    followerMetric: "igFollowers",
    v2Network: "instagram",
    viewMetric: "videoviews",
    engagementMetric: "interactions",
    subject: "reels",
  },
  linkedin: {
    slug: "linkedin",
    name: "LinkedIn",
    handle: "finalREV",
    url: "https://www.linkedin.com/company/finalrev",
    followerMetric: "inFollowers",
    v2Network: "linkedin",
    viewMetric: "impressions",
    engagementMetric: "interactions",
    subject: "posts",
  },
  finalrev_web: {
    slug: "finalrev-web",
    name: "finalREV.com",
    handle: "finalrev.com",
    url: "https://www.finalrev.com",
    posthogHost: "finalrev.com",
  },
  tooltrace_web: {
    slug: "tooltrace-web",
    name: "Tooltrace.ai",
    handle: "tooltrace.ai",
    url: "https://www.tooltrace.ai",
    posthogHost: "tooltrace.ai",
  },
} as const;

export type PlatformKey = keyof typeof PLATFORM_PROFILES;
