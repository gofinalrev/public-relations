import Link from "next/link";
import type { WeeklyReport } from "@/lib/db";
import type { OverviewViewProps } from "@/lib/overview-summary";
import type { ReportMetricQuality } from "@/lib/metric-trust";
import { resolveProSubsDisplay } from "@/lib/metric-trust";
import { pdfDownloadUrl, pdfViewUrl } from "@/lib/overview-summary";
import { formatWeekLabel, parseWeekKey } from "@/lib/weeks";
import {
  findLatestReportedWeek,
  hasLiveSiteMetrics,
  hasSocialMetrics,
  periodHasReportData,
} from "@/lib/period-readiness";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PostHighlightsPanel } from "@/components/dashboard/post-highlights-panel";
import { PostHogInsightsPanel } from "@/components/dashboard/posthog-insights-panel";
import { SectionHeader } from "@/components/dashboard/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OverviewSummaryCard } from "@/components/dashboard/overview-summary-card";
import { parsePostHighlights } from "@/lib/post-highlights";
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

function syncedSublabel(label: string, syncedAt: string | null | undefined): string {
  if (!syncedAt) return label;
  const when = new Date(syncedAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return `${label} · updated ${when}`;
}

export function OverviewView({
  weekStart,
  context,
  pdfMeta,
  summary,
  metrics,
  prev,
  history,
  postHighlightsJson,
  postsLogged = 0,
  metricQuality,
  report = null,
}: OverviewViewProps & {
  postsLogged?: number;
  metricQuality: ReportMetricQuality;
  report?: WeeklyReport | null;
}) {
  const proSubs = resolveProSubsDisplay(metrics.subs, metricQuality);
  const periodLink =
    weekStart !== context.weekKey ? `/?view=period&week=${weekStart}` : "/?view=period";
  const cadUploads = summary.finalrevCadUploads ?? 0;
  const showDelta = context.showWeekOverWeek;
  const postsCount = postsLogged || parsePostHighlights(postHighlightsJson).length;
  const socialReady = hasSocialMetrics({ pdfMeta, metricQuality, metrics });
  const siteLive = hasLiveSiteMetrics(metricQuality);
  const showOverview = periodHasReportData({
    pdfMeta,
    metricQuality,
    postsLogged: postsCount,
    metrics,
  });
  const lastReportedWeek = findLatestReportedWeek(history, weekStart);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-balance text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
            {context.activityLabel}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {context.periodDays > 7 ? `${context.periodDays}-day period` : "Weekly period"}
          </p>
        </div>
        {pdfMeta && (
          <div className="flex shrink-0 gap-2">
            <Button variant="secondary" size="sm" asChild>
              <a href={pdfViewUrl(weekStart)} target="_blank" rel="noopener noreferrer">
                <Eye className="size-3.5" />
                PDF
              </a>
            </Button>
            <Button variant="outline" size="sm" className="hidden sm:inline-flex" asChild>
              <a href={pdfDownloadUrl(weekStart)} download={pdfMeta.filename} aria-label="Download PDF">
                <Download className="size-3.5" />
              </a>
            </Button>
          </div>
        )}
      </div>

      {!showOverview ? (
        <Card className="border-dashed border-foreground/10 bg-muted/20">
          <CardContent className="flex flex-col items-center px-4 py-8 text-center sm:px-6 sm:py-10">
            <Upload className="size-8 text-muted-foreground" aria-hidden />
            <h2 className="mt-3 text-base font-semibold sm:text-lg">No data for this week yet</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Site metrics sync automatically. Import your social report on the This week tab to fill in views and
              reach.
            </p>
            <Button className="mt-4 w-full sm:w-auto" size="sm" asChild>
              <Link href={periodLink}>Go to This week</Link>
            </Button>
            {lastReportedWeek && (
              <p className="mt-4 text-xs text-muted-foreground">
                Last reported:{" "}
                <Link
                  href={`/?week=${lastReportedWeek.week_start}`}
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  {formatWeekLabel(parseWeekKey(lastReportedWeek.week_start))}
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {(summary.summaryLines.length > 0 || summary.teamNote) && (
            <OverviewSummaryCard lines={summary.summaryLines} teamNote={summary.teamNote} />
          )}

          <section>
            <SectionHeader title="Metrics" />
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 xl:grid-cols-5">
              <MetricCard
                label="Video views"
                sublabel={socialReady ? "Social" : "Pending PDF"}
                value={metrics.views}
                displayValue={socialReady ? undefined : "—"}
                unavailable={!socialReady}
                hideDelta={!socialReady}
                previous={showDelta && socialReady ? (prev?.views ?? null) : null}
                comparisonLabel={context.comparisonLabel}
                icon={Play}
                variant="compact"
              />
              <MetricCard
                label="Reach"
                sublabel={socialReady ? "Social" : "Pending PDF"}
                value={metrics.engagement}
                displayValue={socialReady ? undefined : "—"}
                unavailable={!socialReady}
                hideDelta={!socialReady}
                previous={showDelta && socialReady ? (prev?.engagement ?? null) : null}
                comparisonLabel={context.comparisonLabel}
                icon={MousePointerClick}
                variant="compact"
              />
              <MetricCard
                label="Tooltrace visitors"
                sublabel={syncedSublabel("Site metrics", report?.posthog_synced_at)}
                value={metrics.visitors}
                displayValue={siteLive ? undefined : "—"}
                unavailable={!siteLive}
                hideDelta={!siteLive}
                previous={showDelta && siteLive ? (prev?.visitors ?? null) : null}
                comparisonLabel={context.comparisonLabel}
                icon={Users}
                variant="compact"
                highlight={siteLive}
              />
              <MetricCard
                label="Pro subs"
                sublabel={proSubs.sublabel}
                value={metrics.subs}
                displayValue={proSubs.displayValue}
                hideDelta={!proSubs.showDelta}
                unavailable={proSubs.unavailable}
                previous={showDelta && proSubs.showDelta ? (prev?.subs ?? null) : null}
                comparisonLabel={context.comparisonLabel}
                icon={Crown}
                variant="compact"
              />
              <MetricCard
                label="STEP uploads"
                sublabel={syncedSublabel("Site metrics", report?.posthog_synced_at)}
                value={cadUploads}
                displayValue={siteLive ? undefined : "—"}
                unavailable={!siteLive}
                hideDelta
                previous={null}
                comparisonLabel={context.comparisonLabel}
                icon={Upload}
                variant="compact"
              />
            </div>
          </section>

          {siteLive && <PostHogInsightsPanel report={report} compact />}

          <PostHighlightsPanel
            weekStart={weekStart}
            postHighlightsJson={postHighlightsJson}
            compact
          />
        </>
      )}

      <div className="flex justify-center border-t border-foreground/[0.06] pt-5">
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
          <Link href={periodLink}>
            Open this week
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
