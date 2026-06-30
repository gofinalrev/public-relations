import type { WeeklyReport } from "@/lib/db";
import type { DashboardPeriodContext } from "@/lib/period-context";
import { analyzeHistory, topPlatformByHistoricalViews } from "@/lib/history-analytics";
import { parseStoredInsights } from "@/lib/action-items";
import { SOCIAL_PLATFORMS } from "@/lib/platforms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import { Megaphone, TrendingUp } from "lucide-react";

type PrBriefPanelProps = {
  context: DashboardPeriodContext;
  report: WeeklyReport | null;
  previousWeek: WeeklyReport | null;
  history: WeeklyReport[];
};

export function PrBriefPanel({ context, report, previousWeek, history }: PrBriefPanelProps) {
  const analytics = analyzeHistory(history, context.weekKey, previousWeek);
  const growthInsights = parseStoredInsights(report?.growth_insights ?? "");
  const posthogInsights = parseStoredInsights(report?.posthog_insights ?? "");
  const topInsight = [...growthInsights, ...posthogInsights].find(
    (i) => i.type === "critical" || i.type === "warning" || i.type === "success",
  );
  const topHistoricalPlatform = topPlatformByHistoricalViews(analytics.platformTotals);

  return (
    <Card className="border-primary/15 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Megaphone className="size-5 text-primary" />
          Top insight
        </CardTitle>
        <CardDescription>One headline from this period.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {topInsight ? (
          <div className="border border-foreground/[0.08] bg-muted/20 p-3">
            <Badge variant={topInsight.type === "success" ? "default" : "secondary"} className="mb-2 capitalize">
              {topInsight.type}
            </Badge>
            <p className="text-sm font-semibold">{topInsight.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{topInsight.body}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Import a Metricool PDF for insights. PostHog adds funnel data on page load.
          </p>
        )}

        {topHistoricalPlatform && analytics.weeksRecorded >= 2 && (
          <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
            <TrendingUp className="mt-0.5 size-3.5 shrink-0" />
            <span>
              <span className="font-medium text-foreground">All-time leader:</span>{" "}
              {SOCIAL_PLATFORMS[topHistoricalPlatform.slug].name},{" "}
              {formatNumber(topHistoricalPlatform.views)} views across {analytics.weeksRecorded} weeks.
            </span>
          </p>
        )}

        {analytics.bestWeek && analytics.bestWeek.views > analytics.current.views && analytics.current.views > 0 && (
          <p className="text-sm text-muted-foreground">
            Peak week: {analytics.bestWeek.label} ({formatNumber(analytics.bestWeek.views)} views). vs{" "}
            {context.activityLabel}.
          </p>
        )}

        {analytics.weeksRecorded < 2 && (
          <p className="text-xs text-muted-foreground">
            Log a few weekly PDFs to unlock 4-week averages and Trends.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
