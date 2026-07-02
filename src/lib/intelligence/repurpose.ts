import type { PostHighlightPlatform } from "@/lib/post-highlights";
import { platformLabel } from "@/lib/post-highlights";
import { formatNumber } from "@/lib/utils";
import type { IntelligenceInput, RepurposePlan } from "./types";

const REPURPOSE_ORDER: PostHighlightPlatform[] = ["youtube", "instagram", "tiktok", "x", "linkedin"];

export function buildRepurposePlans(input: IntelligenceInput): RepurposePlan[] {
  const { posts } = input;
  if (posts.length === 0) return [];

  const groups = new Map<string, typeof posts>();
  for (const p of posts) {
    const gid = p.groupId ?? `solo-${p.id}`;
    const list = groups.get(gid) ?? [];
    list.push(p);
    groups.set(gid, list);
  }

  const plans: RepurposePlan[] = [];

  for (const [groupId, group] of groups) {
    const sorted = [...group].sort((a, b) => b.views - a.views);
    const source = sorted[0];
    const existingPlatforms = new Set(group.map((p) => p.platform));
    const missing = REPURPOSE_ORDER.filter((p) => !existingPlatforms.has(p) && p !== source.platform);

    if (missing.length === 0 && group.length < 2) continue;

    const targets = missing.slice(0, 3).map((platform, i) => ({
      platform,
      captionAngle:
        platform === "linkedin"
          ? `Pull a DFM or quote takeaway from "${source.title}" for LinkedIn`
          : platform === "x"
            ? `Thread hook from "${source.title}" — keep it under 280 chars`
            : `Same clip on ${platformLabel(platform)} — rewrite the cover text for that feed`,
      coverNote:
        platform === "instagram" ? "Text on frame 1 before the process reveal." : undefined,
      postOrder: i + 2,
    }));

    if (targets.length === 0 && sorted.length >= 2) {
      const laggard = sorted[sorted.length - 1];
      plans.push({
        sourceTitle: source.title,
        sourcePlatform: source.platform,
        groupId,
        targets: [
          {
            platform: laggard.platform,
            captionAngle: `${platformLabel(laggard.platform)} got ${formatNumber(laggard.views)} views vs ${formatNumber(source.views)} on ${platformLabel(source.platform)} — try a native re-cut`,
            coverNote: "Different aspect ratio and stronger first 2 seconds",
            postOrder: 2,
          },
        ],
      });
      continue;
    }

    if (targets.length > 0) {
      plans.push({
        sourceTitle: source.title,
        sourcePlatform: source.platform,
        groupId,
        targets,
      });
    }
  }

  return plans.slice(0, 4);
}
