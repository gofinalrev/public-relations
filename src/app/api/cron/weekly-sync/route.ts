import { NextRequest, NextResponse } from "next/server";
import { getCurrentWeekKey } from "@/lib/weeks";
import { isPostHogConfigured } from "@/lib/posthog/config";
import { isMetricoolConfigured } from "@/lib/metricool/config";
import { syncPostHogForWeek } from "@/app/posthog-actions";
import { syncMetricoolForWeek } from "@/app/metricool-actions";
import { syncSocialChannels } from "@/app/social-sync-actions";
import { getWeeklyReport } from "@/lib/db";
import { buildDashboardPeriodContext } from "@/lib/period-context";
import { postWeeklyDigest } from "@/lib/slack/weekly-digest";
import { deliverWeeklyBrief } from "@/lib/email/deliver-weekly-brief";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET?.trim();

  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weekStart = getCurrentWeekKey();

  try {
    await syncSocialChannels();

    if (isPostHogConfigured()) {
      await syncPostHogForWeek(weekStart);
    }

    if (isMetricoolConfigured()) {
      await syncMetricoolForWeek(weekStart);
    }

    const report = await getWeeklyReport(weekStart);
    if (report) {
      const context = buildDashboardPeriodContext(weekStart, report);
      await postWeeklyDigest({ weekStart, report, context, source: "cron" });
    }

    const emailResult = await deliverWeeklyBrief(weekStart);

    return NextResponse.json({
      ok: true,
      weekStart,
      email: emailResult.ok
        ? emailResult.skipped
          ? { skipped: true, reason: emailResult.reason }
          : { sent: true, messageId: emailResult.messageId }
        : { error: emailResult.error },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 },
    );
  }
}
