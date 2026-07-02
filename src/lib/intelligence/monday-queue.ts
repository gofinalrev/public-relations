import { platformLabel } from "@/lib/post-highlights";
import type { IntelligenceInput, MondayQueueItem } from "./types";
import { buildContentPnl } from "./content-pnl";
import { buildRepurposePlans } from "./repurpose";
import { buildCompetitivePulse } from "./competitive-pulse";
import { canAttributeSocialToTooltrace, resolveContentFocus } from "./content-focus";
import { parseReportBreakdown } from "./context";

export function buildMondayQueue(input: IntelligenceInput): MondayQueueItem[] {
  const { report, posts } = input;
  const queue: MondayQueueItem[] = [];
  const pnl = buildContentPnl(input);
  const pulse = buildCompetitivePulse(input);
  const repurpose = buildRepurposePlans(input);
  const linked = canAttributeSocialToTooltrace(resolveContentFocus(posts));

  queue.push({
    priority: 1,
    title: "Start here",
    body: pnl.nextStep,
  });

  if (!linked && (report?.posthog_visitors ?? 0) > 0 && (report?.metricool_video_views ?? 0) > 0) {
    queue.push({
      priority: 2,
      title: "Separate the numbers",
      body: "Tooltrace visitors aren't from your current finalREV clips — judge each product on its own metrics.",
    });
  }

  for (const plan of repurpose.slice(0, 1)) {
    const lag = plan.targets[0];
    if (lag) {
      queue.push({
        priority: 3,
        title: `Cross-post to ${platformLabel(lag.platform)}`,
        body: lag.captionAngle + (lag.coverNote ? ` ${lag.coverNote}` : ""),
        platform: lag.platform,
      });
    }
  }

  const breakdown = parseReportBreakdown(report);
  const quiet = breakdown?.platforms.filter((p) => p.videoViews === 0 && p.engagement === 0) ?? [];
  for (const p of quiet.slice(0, 1)) {
    queue.push({
      priority: 4,
      title: `${p.name} had no activity`,
      body: "Cross-post this week's best clip with a caption written for that platform.",
      platform: p.platform,
    });
  }

  if (posts.length === 0 && (report?.metricool_video_views ?? 0) > 0) {
    queue.push({
      priority: 5,
      title: "Add post-level stats",
      body: "You have aggregate views but no logged posts — add YouTube Studio / IG numbers under Post performance.",
    });
  }

  const topPost = posts.length ? [...posts].sort((a, b) => b.views - a.views)[0] : null;
  if (topPost && pulse.recommendation !== pnl.nextStep) {
    queue.push({
      priority: 6,
      title: "Channel note",
      body: pulse.recommendation,
    });
  }

  return queue.sort((a, b) => a.priority - b.priority).slice(0, 5);
}
