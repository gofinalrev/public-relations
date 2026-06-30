import { formatNumber } from "@/lib/utils";
import { platformLabel } from "@/lib/post-highlights";
import type { IntelligenceInput, MondayQueueItem } from "./types";
import { buildContentPnl } from "./content-pnl";
import { buildClipAttribution } from "./clip-attribution";
import { buildRepurposePlans } from "./repurpose";
import { parseReportBreakdown } from "./context";

export function buildMondayQueue(input: IntelligenceInput): MondayQueueItem[] {
  const { report, posts } = input;
  const queue: MondayQueueItem[] = [];
  const pnl = buildContentPnl(input);
  const clips = buildClipAttribution(input);
  const repurpose = buildRepurposePlans(input);

  queue.push({
    priority: 1,
    title: "Priority action",
    body: pnl.nextDollarMove,
  });

  if (clips[0]) {
    queue.push({
      priority: 2,
      title: `Increase distribution: ${clips[0].title}`,
      body: `${clips[0].payoffNote} Add Tooltrace link while post has ${formatNumber(clips[0].views)} views.`,
      platform: clips[0].platform,
    });
  }

  for (const plan of repurpose.slice(0, 1)) {
    const lag = plan.targets[0];
    if (lag) {
      queue.push({
        priority: 3,
        title: `Repurpose on ${platformLabel(lag.platform)}`,
        body: `${lag.captionAngle}${lag.coverNote ? ` · ${lag.coverNote}` : ""}`,
        platform: lag.platform,
      });
    }
  }

  const breakdown = parseReportBreakdown(report);
  const quiet = breakdown?.platforms.filter((p) => p.videoViews === 0 && p.engagement === 0) ?? [];
  for (const p of quiet.slice(0, 1)) {
    queue.push({
      priority: 4,
      title: `${p.name} was quiet`,
      body: "Cross-post this week's top Short with a native caption and platform-specific cover.",
      platform: p.platform,
    });
  }

  if (posts.length === 0 && (report?.metricool_video_views ?? 0) > 0) {
    queue.push({
      priority: 5,
      title: "Log top post stats",
      body: "Add YouTube Studio / IG Insights numbers under Post performance for hook tracking.",
    });
  }

  const topPost = posts.length ? [...posts].sort((a, b) => b.views - a.views)[0] : null;
  if (topPost) {
    queue.push({
      priority: 6,
      title: "LinkedIn DFM line",
      body: `LinkedIn post: engineering takeaway from "${topPost.title}" with quote CTA.`,
      platform: "linkedin",
    });
  }

  return queue.sort((a, b) => a.priority - b.priority).slice(0, 5);
}
