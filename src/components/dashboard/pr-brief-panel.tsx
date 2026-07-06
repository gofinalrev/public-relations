import type { WeeklyReport } from "@/lib/db";
import type { DashboardPeriodContext } from "@/lib/period-context";
import { analyzeHistory, topPlatformByHistoricalViews } from "@/lib/history-analytics";
import { parseStoredInsights } from "@/lib/action-items";
import { filterExecutiveInsights } from "@/lib/ops-log";
import { SOCIAL_PLATFORMS } from "@/lib/platforms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

type PrBriefPanelProps = {
  context: DashboardPeriodContext;
  report: WeeklyReport | null;
  previousWeek: WeeklyReport | null;
  history: WeeklyReport[];
};

export function PrBriefPanel({ context, report, previousWeek, history }: PrBriefPanelProps) {
  const analytics = analyzeHistory(history, context.weekKey, previousWeek);
  const growthInsights = filterExecutiveInsights(parseStoredInsights(report?.growth_insights ?? ""));
  const posthogInsights = filterExecutiveInsights(parseStoredInsights(report?.posthog_insights ?? ""));
  const topInsight = [...growthInsights, ...posthogInsights].find(
    (i) => i.type === "critical" || i.type === "warning" || i.type === "success",
  );
  const topHistoricalPlatform = topPlatformByHistoricalViews(analytics.platformTotals);

  const hasPeak =
    analytics.bestWeek &&
    analytics.bestWeek.views > analytics.current.views &&
    analytics.current.views > 0;
  const hasLeader = topHistoricalPlatform && analytics.weeksRecorded >= 2;

  if (!topInsight && !hasPeak && !hasLeader) return null;

  return (
    <Card className="h-full border-foreground/[0.08]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Highlight</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {topInsight && (
          <div>
            <p className="font-medium">{topInsight.title}</p>
            <p className="mt-1 text-muted-foreground">{topInsight.body}</p>
          </div>
        )}

        {hasLeader && (
          <p className="flex items-start gap-1.5 text-muted-foreground">
            <TrendingUp className="mt-0.5 size-3.5 shrink-0" />
            <span>
              {SOCIAL_PLATFORMS[topHistoricalPlatform.slug].name} leads all-time with{" "}
              {formatNumber(topHistoricalPlatform.views)} views ({analytics.weeksRecorded} weeks logged).
            </span>
          </p>
        )}

        {hasPeak && (
          <p className="text-muted-foreground">
            Peak week: {analytics.bestWeek!.label} ({formatNumber(analytics.bestWeek!.views)} views).
          </p>
        )}
      </CardContent>
    </Card>
  );
}
