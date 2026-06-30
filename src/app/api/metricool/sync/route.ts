import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { syncMetricoolForWeek } from "@/app/metricool-actions";
import { isMetricoolConfigured } from "@/lib/metricool/config";
import { getCurrentWeekKey } from "@/lib/weeks";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const weekStart = (body.week as string) || request.nextUrl.searchParams.get("week") || getCurrentWeekKey();

  const result = await syncMetricoolForWeek(weekStart);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.error?.includes("not configured") ? 503 : 502 });
  }

  revalidatePath("/");
  return NextResponse.json(result);
}

export async function GET() {
  return NextResponse.json({
    configured: isMetricoolConfigured(),
    docs: "https://help.metricool.com/api-access-export-your-metricool-data-to-other-tools-and-automate-tasks-x8ln5",
    note: "API access requires Metricool Advanced plan ($20+/mo). Get token from Account Settings → API.",
  });
}
