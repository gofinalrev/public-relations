export type UtmLink = {
  platform: string;
  label: string;
  url: string;
};

const BASE_URLS = {
  tooltrace: "https://www.tooltrace.ai",
  finalrev: "https://www.finalrev.com",
} as const;

export function buildUtmUrl(
  base: keyof typeof BASE_URLS,
  source: string,
  medium = "social",
  campaign?: string,
  content?: string,
): string {
  const url = new URL(BASE_URLS[base]);
  url.searchParams.set("utm_source", source);
  url.searchParams.set("utm_medium", medium);
  url.searchParams.set("utm_campaign", campaign ?? `weekly-${new Date().toISOString().slice(0, 10)}`);
  if (content) url.searchParams.set("utm_content", content);
  return url.toString();
}

export function getPlatformUtmLinks(weekCampaign?: string): UtmLink[] {
  const campaign = weekCampaign ?? `checkin-${new Date().toISOString().slice(0, 10)}`;

  return [
    { platform: "youtube", label: "Tooltrace · YouTube bio", url: buildUtmUrl("tooltrace", "youtube", "video", campaign) },
    { platform: "x", label: "Tooltrace · X bio", url: buildUtmUrl("tooltrace", "x", "social", campaign) },
    { platform: "instagram", label: "Tooltrace · IG bio", url: buildUtmUrl("tooltrace", "instagram", "social", campaign) },
    { platform: "linkedin", label: "finalREV · LinkedIn", url: buildUtmUrl("finalrev", "linkedin", "social", campaign) },
    { platform: "tiktok", label: "Tooltrace · TikTok bio", url: buildUtmUrl("tooltrace", "tiktok", "video", campaign) },
    { platform: "facebook", label: "finalREV · Facebook", url: buildUtmUrl("finalrev", "facebook", "social", campaign) },
    { platform: "reddit", label: "Tooltrace · Reddit", url: buildUtmUrl("tooltrace", "reddit", "social", campaign) },
  ];
}

export type ReferrerMapping = {
  platform: string;
  domain: string;
  visitors: number;
};

const REFERRER_PLATFORM: Array<{ platform: string; patterns: string[] }> = [
  { platform: "X", patterns: ["t.co", "twitter.com", "x.com"] },
  { platform: "Instagram", patterns: ["instagram.com", "l.instagram.com"] },
  { platform: "YouTube", patterns: ["youtube.com", "youtu.be"] },
  { platform: "LinkedIn", patterns: ["linkedin.com", "lnkd.in"] },
  { platform: "Facebook", patterns: ["facebook.com", "fb.com", "l.facebook.com"] },
  { platform: "Reddit", patterns: ["reddit.com"] },
  { platform: "TikTok", patterns: ["tiktok.com"] },
];

export function mapReferrersToPlatforms(
  referrers: Array<{ domain: string; visitors: number }>,
): ReferrerMapping[] {
  const mapped: ReferrerMapping[] = [];
  let directVisitors = 0;

  for (const ref of referrers) {
    if (ref.domain === "$direct" || ref.domain === "direct") {
      directVisitors += ref.visitors;
      continue;
    }

    const match = REFERRER_PLATFORM.find((p) => p.patterns.some((pat) => ref.domain.includes(pat)));
    mapped.push({
      platform: match?.platform ?? ref.domain,
      domain: ref.domain,
      visitors: ref.visitors,
    });
  }

  if (directVisitors > 0) {
    mapped.push({ platform: "Direct / unknown", domain: "direct", visitors: directVisitors });
  }

  return mapped.sort((a, b) => b.visitors - a.visitors);
}

export function computeGoalVelocity(
  current: number,
  target: number,
  gainedInPeriod: number | null,
  periodDays: number | null,
): string | null {
  if (target <= 0 || current >= target) return null;
  if (!gainedInPeriod || gainedInPeriod <= 0 || !periodDays || periodDays <= 0) {
    return `${(((target - current) / target) * 100).toFixed(0)}% remaining to goal`;
  }

  const dailyPace = gainedInPeriod / periodDays;
  if (dailyPace <= 0) return null;

  const remaining = target - current;
  const daysToGoal = remaining / dailyPace;

  if (daysToGoal > 365 * 3) return "At this pace: 3+ years left. Post more.";
  if (daysToGoal > 365) return `At this pace: ~${Math.round(daysToGoal / 30)} months left`;
  if (daysToGoal > 14) return `At this pace: ~${Math.round(daysToGoal / 7)} weeks left`;
  return `At this pace: ~${Math.round(daysToGoal)} days left`;
}
