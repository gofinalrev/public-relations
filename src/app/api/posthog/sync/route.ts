import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isPostHogConfigured } from "@/lib/posthog/config";
import { fetchWeeklyPostHogMetrics } from "@/lib/posthog/metrics";
import { analyzePostHogWeek, formatInsightsForStorage } from "@/lib/posthog/insights";
import { getWeeklyReport, upsertPostHogSync } from "@/lib/db";
import { getPreviousWeekKey, getCurrentWeekKey } from "@/lib/weeks";
import { PostHogApiError } from "@/lib/posthog/client";

export async function POST(request: NextRequest) {
  try {
    if (!isPostHogConfigured()) {
      return NextResponse.json(
        {
          error: "PostHog not configured",
          hint: "Add POSTHOG_PERSONAL_API_KEY and POSTHOG_TOOLTRACE_PROJECT_ID=167207 to .env.local",
          docs: "https://posthog.com/docs/api/queries",
        },
        { status: 503 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const weekStart = (body.week as string) || request.nextUrl.searchParams.get("week") || getCurrentWeekKey();

    const [currentMetrics, previousMetrics] = await Promise.all([
      fetchWeeklyPostHogMetrics(weekStart),
      fetchWeeklyPostHogMetrics(getPreviousWeekKey(weekStart)).catch(() => null),
    ]);

    const existing = await getWeeklyReport(weekStart);
    const previousReport = await getWeeklyReport(getPreviousWeekKey(weekStart));

    const analysis = analyzePostHogWeek(
      currentMetrics,
      previousMetrics,
      previousReport,
      existing,
    );

    const report = await upsertPostHogSync(weekStart, {
      visitors: currentMetrics.uniqueVisitors,
      subscriptions: currentMetrics.newSubscriptions,
      insights: formatInsightsForStorage(analysis),
      funnelJson: JSON.stringify({
        funnel: currentMetrics.funnel,
        topReferrers: currentMetrics.topReferrers,
        subscriptionEventUsed: currentMetrics.subscriptionEventUsed,
        fetchedAt: currentMetrics.fetchedAt,
        analysis: {
          conversionRate: analysis.conversionRate,
          activationRate: analysis.activationRate,
          suggestedFindings: analysis.suggestedFindings,
        },
      }),
      learning: analysis.suggestedLearning || undefined,
    });

    revalidatePath("/");

    return NextResponse.json({
      ok: true,
      weekStart,
      metrics: currentMetrics,
      analysis,
      report,
    });
  } catch (error) {
    if (error instanceof PostHogApiError) {
      return NextResponse.json({ error: error.message, status: error.status }, { status: error.status ?? 502 });
    }
    console.error("PostHog sync failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "PostHog sync failed" },
      { status: 500 },
    );
  }
}

export async function GET() {
  const configured = isPostHogConfigured();
  return NextResponse.json({
    configured,
    projectId: process.env.POSTHOG_TOOLTRACE_PROJECT_ID ?? "167207",
    finalrevProjectId: process.env.POSTHOG_PROJECT_ID ?? "209711",
    host: process.env.POSTHOG_HOST ?? "https://us.posthog.com",
  });
}
