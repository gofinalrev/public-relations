import type { PostHighlightPlatform } from "@/lib/post-highlights";
import { platformLabel } from "@/lib/post-highlights";
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
          ? `Engineer takeaway from "${source.title}": DFM or quote angle for finalREV`
          : platform === "x"
            ? `Short-form post using hook from "${source.title}"`
            : `Same clip, native ${platformLabel(platform)} cover text`,
      coverNote:
        platform === "instagram" ? "Add text overlay in first frame before process reveal." : undefined,
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
            captionAngle: `Re-cut for ${platformLabel(laggard.platform)}: source got ${source.views} views vs ${laggard.views}`,
            coverNote: "Native aspect + stronger first 2s",
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
