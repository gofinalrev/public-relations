export type YouTubeChannelStats = {
  subscribers: number;
  totalViews: number;
  videoCount: number;
  hiddenSubscriberCount: boolean;
  fetchedAt: string;
};

export function isYouTubeConfigured(): boolean {
  return Boolean(process.env.YOUTUBE_API_KEY?.trim());
}

export async function fetchYouTubeChannelStats(handle = "gofinalrev"): Promise<YouTubeChannelStats | null> {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  if (!apiKey) return null;

  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.searchParams.set("part", "statistics");
  url.searchParams.set("forHandle", handle.replace(/^@/, ""));
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!response.ok) return null;

  const data = (await response.json()) as {
    items?: Array<{
      statistics?: {
        subscriberCount?: string;
        viewCount?: string;
        videoCount?: string;
        hiddenSubscriberCount?: boolean;
      };
    }>;
  };

  const stats = data.items?.[0]?.statistics;
  if (!stats) return null;

  return {
    subscribers: Number(stats.subscriberCount ?? 0),
    totalViews: Number(stats.viewCount ?? 0),
    videoCount: Number(stats.videoCount ?? 0),
    hiddenSubscriberCount: Boolean(stats.hiddenSubscriberCount),
    fetchedAt: new Date().toISOString(),
  };
}
