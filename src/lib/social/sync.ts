import { updateChannel, getAllChannels } from "@/lib/db";
import { fetchYouTubeChannelStats, isYouTubeConfigured } from "./youtube";
import { fetchRedditSubredditStats } from "./reddit";

export type SocialSyncResult = {
  youtube: { ok: boolean; subscribers?: number } | null;
  reddit: { ok: boolean; subscribers?: number; exists?: boolean } | null;
};

export async function syncFreeChannelStats(): Promise<SocialSyncResult> {
  const result: SocialSyncResult = { youtube: null, reddit: null };

  if (isYouTubeConfigured()) {
    const stats = await fetchYouTubeChannelStats();
    if (stats && !stats.hiddenSubscriberCount) {
      await updateChannel("youtube", {
        current_value: stats.subscribers,
        status: stats.subscribers >= 1000 ? "achieved" : "active",
      });
      result.youtube = { ok: true, subscribers: stats.subscribers };
    } else if (stats?.hiddenSubscriberCount) {
      result.youtube = { ok: false };
    }
  }

  const redditChannel = (await getAllChannels()).find((c) => c.slug === "reddit");
  if (redditChannel) {
    const stats = await fetchRedditSubredditStats("finalrev");
    if (stats) {
      if (stats.exists) {
        await updateChannel("reddit", {
          current_value: stats.subscribers,
          status:
            stats.subscribers >= redditChannel.goal_target
              ? "achieved"
              : redditChannel.status === "setup_needed"
                ? "active"
                : redditChannel.status,
        });
      }
      result.reddit = { ok: true, subscribers: stats.subscribers, exists: stats.exists };
    }
  }

  return result;
}
