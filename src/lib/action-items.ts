import type { GrowthInsight } from "@/lib/metricool/insights";
import { filterExecutiveInsights } from "@/lib/ops-log";

export type ActionItem = {
  id: string;
  priority: "P1" | "P2" | "P3";
  title: string;
  body: string;
  source: "growth" | "posthog" | "system";
  done: boolean;
};

const PRIORITY_MAP: Record<string, ActionItem["priority"]> = {
  critical: "P1",
  warning: "P2",
  info: "P3",
  success: "P3",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 48);
}

function insightToAction(
  insight: { type: string; title: string; body: string },
  source: ActionItem["source"],
  index: number,
): ActionItem {
  return {
    id: `${source}-${slugify(insight.title)}-${index}`,
    priority: PRIORITY_MAP[insight.type] ?? "P3",
    title: insight.title,
    body: insight.body,
    source,
    done: false,
  };
}

export function parseStoredInsights(raw: string): Array<{ type: string; title: string; body: string }> {
  if (!raw.trim()) return [];
  return filterExecutiveInsights(
    raw.split("\n\n").flatMap((block) => {
      const match = block.match(/^\[(\w+)\]\s([^:]+):\s([\s\S]+)$/);
      if (!match) return [];
      return [{ type: match[1].toLowerCase(), title: match[2].trim(), body: match[3].trim() }];
    }),
  );
}

export function buildActionItems(
  growthInsights: GrowthInsight[],
  posthogInsights: Array<{ type: string; title: string; body: string }>,
  existingJson?: string,
): ActionItem[] {
  const existing: ActionItem[] = existingJson ? JSON.parse(existingJson) : [];
  const doneIds = new Set(existing.filter((i) => i.done).map((i) => i.id));

  const fromGrowth = growthInsights
    .filter((i) => i.type === "critical" || i.type === "warning")
    .slice(0, 3)
    .map((i, idx) => insightToAction(i, "growth", idx));

  const fromPosthog = filterExecutiveInsights(posthogInsights)
    .filter((i) => i.type === "critical" || i.type === "warning")
    .slice(0, 2)
    .map((i, idx) => insightToAction(i, "posthog", idx));

  const combined = [...fromGrowth, ...fromPosthog];

  if (combined.length === 0) {
    const infoItems = growthInsights.slice(0, 2).map((i, idx) => insightToAction(i, "growth", idx + 10));
    combined.push(...infoItems);
  }

  const seen = new Set<string>();
  const deduped: ActionItem[] = [];

  for (const item of combined) {
    const key = item.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push({
      ...item,
      done: doneIds.has(item.id),
    });
  }

  for (const old of existing) {
    if (old.done && !deduped.some((d) => d.id === old.id)) {
      deduped.push(old);
    }
  }

  return deduped.slice(0, 6);
}

export function mergeActionItemDone(items: ActionItem[], itemId: string, done: boolean): ActionItem[] {
  return items.map((item) => (item.id === itemId ? { ...item, done } : item));
}
