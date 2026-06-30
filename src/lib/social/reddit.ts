export type RedditSubredditStats = {
  subscribers: number;
  activeUsers: number;
  exists: boolean;
  fetchedAt: string;
};

const USER_AGENT = "finalREV-SocialHQ/1.0 (local dashboard)";

export async function fetchRedditSubredditStats(subreddit = "finalrev"): Promise<RedditSubredditStats | null> {
  try {
    const response = await fetch(`https://www.reddit.com/r/${subreddit}/about.json`, {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: 3600 },
    });

    if (response.status === 404) {
      return { subscribers: 0, activeUsers: 0, exists: false, fetchedAt: new Date().toISOString() };
    }

    if (!response.ok) return null;

    const data = (await response.json()) as {
      data?: { subscribers?: number; active_user_count?: number };
    };

    return {
      subscribers: data.data?.subscribers ?? 0,
      activeUsers: data.data?.active_user_count ?? 0,
      exists: true,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
