import type { PostHighlight, PostHighlightPlatform } from "@/lib/post-highlights";
import type { WeeklyReport } from "@/lib/db";
import type { HookEntry } from "./types";
import { extractHook } from "./context";
import { parsePostHighlights } from "@/lib/post-highlights";

export function buildHookLibrary(history: WeeklyReport[], currentPosts: PostHighlight[]): HookEntry[] {
  const byHook = new Map<
    string,
    { hook: string; platform: PostHighlightPlatform; format?: string; views: number[]; weeks: Set<string> }
  >();

  for (const report of history) {
    const posts = parsePostHighlights(report.post_highlights_json);
    for (const post of posts) {
      const hook = extractHook(post.title);
      const key = `${post.platform}:${hook.toLowerCase()}`;
      const existing = byHook.get(key) ?? {
        hook,
        platform: post.platform,
        format: post.format,
        views: [],
        weeks: new Set<string>(),
      };
      existing.views.push(post.views);
      existing.weeks.add(report.week_start);
      byHook.set(key, existing);
    }
  }

  for (const post of currentPosts) {
    const hook = extractHook(post.title);
    const key = `${post.platform}:${hook.toLowerCase()}`;
    const existing = byHook.get(key) ?? {
      hook,
      platform: post.platform,
      format: post.format,
      views: [],
      weeks: new Set<string>(),
    };
    existing.views.push(post.views);
    byHook.set(key, existing);
  }

  return [...byHook.values()]
    .map((entry, i) => {
      const avgViews = entry.views.reduce((s, v) => s + v, 0) / entry.views.length;
      return {
        id: `hook-${i}-${entry.platform}`,
        hook: entry.hook,
        platform: entry.platform,
        format: entry.format,
        avgViews: Math.round(avgViews),
        appearances: entry.views.length,
        visitRateEstimate: null,
        status: (entry.weeks.size >= 2 && avgViews >= 800 ? "validated" : "hypothesis") as HookEntry["status"],
      };
    })
    .sort((a, b) => b.avgViews - a.avgViews)
    .slice(0, 12);
}
