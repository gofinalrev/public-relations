import { NextRequest, NextResponse } from "next/server";
import { getCurrentWeekKey } from "@/lib/weeks";
import { deliverWeeklyBrief } from "@/lib/email/deliver-weekly-brief";

export const runtime = "nodejs";

/** Manual trigger: GET /api/cron/weekly-brief?week=2026-06-29&force=1 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET?.trim();

  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weekStart = request.nextUrl.searchParams.get("week")?.trim() || getCurrentWeekKey();
  const force = request.nextUrl.searchParams.get("force") === "1";

  const result = await deliverWeeklyBrief(weekStart, { force });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    weekStart,
    skipped: "skipped" in result ? result.skipped : false,
    reason: "reason" in result ? result.reason : undefined,
    messageId: "messageId" in result ? result.messageId : undefined,
    subject: result.analysis?.subject,
  });
}
