import Link from "next/link";
import type { OverviewViewProps } from "@/lib/overview-summary";
import { pdfDownloadUrl, pdfViewUrl } from "@/lib/overview-summary";
import { MetricCard } from "@/components/dashboard/metric-card";
import { OverviewTrendChart } from "@/components/dashboard/overview-trend-chart";
import { PostHighlightsPanel } from "@/components/dashboard/post-highlights-panel";
import { SectionHeader } from "@/components/dashboard/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Play,
  Users,
  Crown,
  MousePointerClick,
  ArrowRight,
  Eye,
  Download,
  Upload,
} from "lucide-react";

const headlineTone: Record<string, string> = {
  learning: "border-primary/25 bg-primary/5",
  success: "border-primary/30 bg-primary/10",
  warning: "border-amber-500/30 bg-amber-500/5",
  critical: "border-destructive/30 bg-destructive/5",
  info: "border-foreground/10 bg-muted/30",
};

export function OverviewView({
  weekStart,
  context,
  pdfMeta,
  summary,
  metrics,
  prev,
  subsSource,
  history,
  postHighlightsJson,
}: OverviewViewProps) {
  const periodLink =
    weekStart !== context.weekKey ? `/?view=period&week=${weekStart}` : "/?view=period";
  const cadUploads = summary.finalrevCadUploads ?? 0;
  const showDelta = context.showWeekOverWeek;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{context.activityLabel}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {context.periodDays > 7 ? `${context.periodDays}-day report` : "Weekly report"}
            {context.isMultiWeekReport ? " · from Metricool PDF" : ""}
          </p>
        </div>
        {pdfMeta && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" asChild>
              <a href={pdfViewUrl(weekStart)} target="_blank" rel="noopener noreferrer">
                <Eye className="size-3.5" />
                View report
              </a>
            </Button>
            <Button variant="outline" size="sm" className="hidden sm:inline-flex" asChild>
              <a href={pdfDownloadUrl(weekStart)} download={pdfMeta.filename}>
                <Download className="size-3.5" />
              </a>
            </Button>
          </div>
        )}
      </div>

      {summary.headline && (
        <Card
          className={cn(
            "border",
            headlineTone[summary.headlineType ?? "info"] ?? headlineTone.info,
          )}
        >
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm leading-relaxed sm:text-base">{summary.headline}</p>
          </CardContent>
        </Card>
      )}

      <section>
        <SectionHeader title="Key numbers" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <MetricCard
            label="Video views"
            sublabel="Social · Metricool"
            value={metrics.views}
            previous={showDelta ? (prev?.views ?? null) : null}
            comparisonLabel={context.comparisonLabel}
            icon={Play}
            variant="compact"
          />
          <MetricCard
            label="Reach + clicks"
            sublabel="Social · Metricool"
            value={metrics.engagement}
            previous={showDelta ? (prev?.engagement ?? null) : null}
            comparisonLabel={context.comparisonLabel}
            icon={MousePointerClick}
            variant="compact"
          />
          <MetricCard
            label="Tooltrace visitors"
            sublabel="tooltrace.ai"
            value={metrics.visitors}
            previous={showDelta ? (prev?.visitors ?? null) : null}
            comparisonLabel={context.comparisonLabel}
            icon={Users}
            variant="compact"
          />
          <MetricCard
            label="Pro subscriptions"
            sublabel={subsSource}
            value={metrics.subs}
            previous={showDelta ? (prev?.subs ?? null) : null}
            highlight
            comparisonLabel={context.comparisonLabel}
            icon={Crown}
            variant="compact"
          />
          <MetricCard
            label="STEP uploads"
            sublabel="finalrev.com"
            value={cadUploads}
            previous={null}
            comparisonLabel={context.comparisonLabel}
            icon={Upload}
            variant="compact"
          />
        </div>
      </section>

      <PostHighlightsPanel
        weekStart={weekStart}
        postHighlightsJson={postHighlightsJson}
        compact
      />

      <OverviewTrendChart history={history} currentWeekKey={weekStart} />

      <div className="flex justify-center border-t border-foreground/[0.06] pt-4">
        <Link
          href={periodLink}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          Platform breakdown, goals & ops
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
