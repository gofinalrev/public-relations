"use server";

import { revalidatePath } from "next/cache";
import {
  upsertWeeklyReport,
  updateChannel,
  getWeeklyReport,
  updateActionItems,
  getAllChannels,
  type Channel,
} from "@/lib/db";
import { mergeActionItemDone, type ActionItem } from "@/lib/action-items";
import { isPeriodGoalChannel, milestoneStatusAfterSave } from "@/lib/channel-goals";

export async function saveWeeklyReport(formData: FormData) {
  const weekStart = formData.get("week_start") as string;
  const existing = await getWeeklyReport(weekStart);

  await upsertWeeklyReport({
    week_start: weekStart,
    metricool_video_views: existing?.metricool_video_views ?? Number(formData.get("metricool_video_views") || 0),
    metricool_engagement: existing?.metricool_engagement ?? Number(formData.get("metricool_engagement") || 0),
    posthog_visitors: existing?.posthog_visitors ?? Number(formData.get("posthog_visitors") || 0),
    posthog_subscriptions: existing?.posthog_subscriptions ?? Number(formData.get("posthog_subscriptions") || 0),
    learning: (formData.get("learning") as string) || "",
    locked_findings: (formData.get("locked_findings") as string) || "",
    posthog_insights: existing?.posthog_insights ?? "",
    posthog_funnel_json: existing?.posthog_funnel_json ?? "",
    posthog_synced_at: existing?.posthog_synced_at ?? null,
    metricool_breakdown_json: existing?.metricool_breakdown_json ?? "",
    metricool_synced_at: existing?.metricool_synced_at ?? null,
    growth_insights: existing?.growth_insights ?? "",
    action_items_json: existing?.action_items_json ?? "[]",
    caption_studio_json: existing?.caption_studio_json ?? "{}",
    post_highlights_json: existing?.post_highlights_json ?? "{}",
    intelligence_json: existing?.intelligence_json ?? "",
  });

  revalidatePath("/");
  revalidatePath(`/?week=${weekStart}`);
}

export async function saveChannel(formData: FormData) {
  const slug = formData.get("slug") as string;
  const current_value = Number(formData.get("current_value") || 0);
  const statusInput = formData.get("status") as Channel["status"];
  const notes = (formData.get("notes") as string) || "";

  const existing = (await getAllChannels()).find((c) => c.slug === slug);
  if (!existing) {
    return { ok: false as const, error: "Channel not found" };
  }

  if (isPeriodGoalChannel(slug)) {
    return { ok: false as const, error: "Period goals sync from PostHog — pick a week with site data" };
  }

  const status = milestoneStatusAfterSave(current_value, existing.goal_target, statusInput);

  const updated = await updateChannel(slug, {
    current_value,
    status,
    notes,
  });

  revalidatePath("/");

  return {
    ok: true as const,
    slug,
    current_value: updated?.current_value ?? current_value,
    status: updated?.status ?? status,
  };
}

export async function toggleActionItem(weekStart: string, itemId: string, done: boolean) {
  const report = await getWeeklyReport(weekStart);
  if (!report) return;

  let items: ActionItem[] = [];
  try {
    items = JSON.parse(report.action_items_json || "[]");
  } catch {
    return;
  }

  await updateActionItems(weekStart, JSON.stringify(mergeActionItemDone(items, itemId, done)));
  revalidatePath("/");
  revalidatePath(`/?week=${weekStart}`);
}
