"use server";

import { revalidatePath } from "next/cache";
import { getDashboardData, updatePostHighlights } from "@/lib/db";
import { buildDashboardPeriodContext } from "@/lib/period-context";
import { loadOrBuildIntelligence } from "@/lib/intelligence/persist";
import { type PostHighlight, serializePostHighlights } from "@/lib/post-highlights";

export async function savePostHighlights(weekStart: string, posts: PostHighlight[]) {
  await updatePostHighlights(weekStart, serializePostHighlights(posts));
  const { report, previousWeek, history, channels } = await getDashboardData(weekStart);
  const context = buildDashboardPeriodContext(weekStart, report);
  await loadOrBuildIntelligence({
    weekStart,
    report,
    previousReport: previousWeek,
    history,
    channels,
    context,
    force: true,
  });
  revalidatePath("/");
  revalidatePath(`/?week=${weekStart}`);
}
