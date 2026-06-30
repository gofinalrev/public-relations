import type { HookEntry, IntelligenceInput, PlaybookEntry } from "./types";
import { shopFloorSignal, aestheticSignal } from "./context";

export function buildPlaybookFromWeek(input: IntelligenceInput, hooks: HookEntry[]): PlaybookEntry[] {
  const { report, posts, weekStart } = input;
  const entries: PlaybookEntry[] = [];

  for (const hook of hooks.filter((h) => h.status === "validated").slice(0, 4)) {
    entries.push({
      id: `pb-hook-${hook.id}`,
      type: "hook",
      title: `"${hook.hook}" on ${hook.platform}`,
      body: `Averaged ${hook.avgViews.toLocaleString()} views across ${hook.appearances} posts.`,
      platform: hook.platform,
      status: "validated",
      evidenceWeeks: [weekStart],
      liftPct: undefined,
    });
  }

  const shopPosts = posts.filter((p) => shopFloorSignal(p.title));
  const aestheticPosts = posts.filter((p) => aestheticSignal(p.title));
  if (shopPosts.length >= 2 && aestheticPosts.length >= 1) {
    const shopAvg = shopPosts.reduce((s, p) => s + p.views, 0) / shopPosts.length;
    const aesAvg = aestheticPosts.reduce((s, p) => s + p.views, 0) / aestheticPosts.length;
    if (shopAvg > aesAvg * 1.3) {
      entries.push({
        id: `pb-validated-shop-${weekStart}`,
        type: "validated",
        title: "Shop-floor hooks outperform aesthetic edits",
        body: `Shop-floor content averaged ${Math.round(shopAvg).toLocaleString()} views vs ${Math.round(aesAvg).toLocaleString()} for aesthetic edits.`,
        status: "validated",
        evidenceWeeks: [weekStart],
        liftPct: Math.round(((shopAvg - aesAvg) / aesAvg) * 100),
      });
    }
  }

  const experiments = posts.filter((p) => p.experiment?.trim());
  for (const post of experiments) {
    entries.push({
      id: `pb-exp-${post.id}`,
      type: "experiment",
      title: post.experiment!,
      body: `"${post.title}" on ${post.platform} — ${post.views.toLocaleString()} views. Compare next period.`,
      platform: post.platform,
      status: "hypothesis",
      evidenceWeeks: [weekStart],
    });
  }

  if (report?.locked_findings?.trim()) {
    entries.push({
      id: `pb-lock-${weekStart}`,
      type: "validated",
      title: "Team lock-in",
      body: report.locked_findings.trim(),
      status: "validated",
      evidenceWeeks: [weekStart],
    });
  }

  return entries.slice(0, 8);
}

export function mergePlaybookEntries(stored: PlaybookEntry[], fresh: PlaybookEntry[]): PlaybookEntry[] {
  const byId = new Map<string, PlaybookEntry>();
  for (const e of stored) byId.set(e.id, e);
  for (const e of fresh) {
    const existing = byId.get(e.id);
    if (existing) {
      const weeks = new Set([...existing.evidenceWeeks, ...e.evidenceWeeks]);
      byId.set(e.id, {
        ...existing,
        evidenceWeeks: [...weeks],
        status: weeks.size >= 2 && existing.type !== "experiment" ? "validated" : existing.status,
      });
    } else {
      byId.set(e.id, e);
    }
  }
  return [...byId.values()]
    .filter((e) => e.status !== "retired")
    .sort((a, b) => b.evidenceWeeks.length - a.evidenceWeeks.length)
    .slice(0, 20);
}
