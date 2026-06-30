import { getDashboardData } from "@/lib/db";
import { buildDashboardPeriodContext } from "@/lib/period-context";
import { buildWeeklyBriefAnalysis } from "@/lib/email/weekly-brief-analysis";
import { sendWeeklyBriefEmail, type SendWeeklyBriefResult } from "@/lib/email/send-weekly-brief";

export async function deliverWeeklyBrief(
  weekStart: string,
  options?: { force?: boolean },
): Promise<SendWeeklyBriefResult & { analysis?: ReturnType<typeof buildWeeklyBriefAnalysis> }> {
  const { report, previousWeek, history, channels } = await getDashboardData(weekStart);
  const context = buildDashboardPeriodContext(weekStart, report);
  const analysis = buildWeeklyBriefAnalysis({
    weekStart,
    report,
    previousReport: previousWeek,
    history,
    channels,
    context,
  });

  if (!analysis) {
    return { ok: false, error: "No report data for this week — sync PostHog or import Metricool PDF first" };
  }

  const result = await sendWeeklyBriefEmail(weekStart, analysis, options);
  return { ...result, analysis };
}
