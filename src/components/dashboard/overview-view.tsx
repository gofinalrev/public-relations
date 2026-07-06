import Link from "next/link";
import type { MetricoolPdfMeta, WeeklyReport } from "@/lib/db";
import type { OverviewViewProps } from "@/lib/overview-summary";
import type { WeeklyIntelligence } from "@/lib/intelligence/types";
import type { ReportMetricQuality } from "@/lib/metric-trust";
import { resolveProSubsDisplay } from "@/lib/metric-trust";
import { pdfDownloadUrl, pdfViewUrl } from "@/lib/overview-summary";
import {
  findLatestReportedWeek,
  hasLiveSiteMetrics,
  hasSocialMetrics,
  periodHasReportData,
} from "@/lib/period-readiness";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PostHighlightsPanel } from "@/components/dashboard/post-highlights-panel";
import { PostHogInsightsPanel } from "@/components/dashboard/posthog-insights-panel";
import { IntelligenceOverview } from "@/components/dashboard/intelligence/intelligence-overview";
import { SectionHeader } from "@/components/dashboard/section-header";
import { Button } from "@/components/ui/button";
import { OverviewSummaryCard } from "@/components/dashboard/overview-summary-card";
import { DataTrustBanner } from "@/components/dashboard/data-trust-banner";
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

const headlineTone: Record<string, string> = {
  learning: "border-primary/25 bg-primary/5",
  success: "border-primary/30 bg-primary/10",
  warning: "border-amber-500/30 bg-amber-500/5",
  critical: "border-destructive/30 bg-destructive/5",
  info: "border-foreground/10 bg-muted/30",
};

function syncedSublabel(source: string, syncedAt: string | null | undefined): string {
  if (!syncedAt) return source;
  const when = new Date(syncedAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return `${source} · synced ${when}`;
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
  intelligence,
  postsLogged = 0,
  metricQuality,
  report = null,
}: OverviewViewProps & {
  intelligence: WeeklyIntelligence;
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
  const showIntel =
    socialReady || postsCount > 0 || summary.summaryLines.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Reporting period
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{context.activityLabel}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {context.periodDays > 7 ? `${context.periodDays}-day report` : "Weekly report"}
            {siteLive && !socialReady ? " · site metrics live" : ""}
          </p>
        </div>
        {pdfMeta && (
          <div className="flex shrink-0 gap-2">
            <Button variant="secondary" size="sm" asChild>
              <a href={pdfViewUrl(weekStart)} target="_blank" rel="noopener noreferrer">
                <Eye className="size-3.5" />
                View report
              </a>
            </Button>
            <Button variant="outline" size="sm" className="hidden sm:inline-flex" asChild>
              <a href={pdfDownloadUrl(weekStart)} download={pdfMeta.filename} aria-label="Download report">
                <Download className="size-3.5" />
              </a>
            </Button>
          </div>
        )}
      </div>

      {!showOverview ? (
        <p className="text-sm text-muted-foreground">
          Site metrics sync from PostHog on load.{" "}
          <Link href={periodLink} className="font-medium text-foreground underline-offset-4 hover:underline">
            Period tab
          </Link>{" "}
          for Metricool PDF import.
          {lastReportedWeek && (
            <>
              {" "}
              <Link
                href={`/?week=${lastReportedWeek.week_start}`}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                View {lastReportedWeek.week_start}
              </Link>
            </>
          )}
        </p>
      ) : (
        <>
          <DataTrustBanner
            quality={metricQuality}
            context={context}
            includeGlobalConfig={false}
            includeSocialPending={false}
          />

          <section>
            <SectionHeader title="Key numbers" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <MetricCard
                label="Video views"
                sublabel={socialReady ? "Metricool · social" : "Imports with PDF"}
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
                label="Reach + clicks"
                sublabel={socialReady ? "Metricool · social" : "Imports with PDF"}
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
                sublabel={syncedSublabel("PostHog · unique", report?.posthog_synced_at)}
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
                label="Pro subscriptions"
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
                sublabel={syncedSublabel("PostHog · finalrev.com", report?.posthog_synced_at)}
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
            {!socialReady && (
              <p className="mt-3 text-xs text-muted-foreground">
                Social columns fill in on{" "}
                <Link href={periodLink} className="underline-offset-4 hover:underline">
                  Period tab
                </Link>{" "}
                when the Metricool PDF is imported.
              </p>
            )}
          </section>

          {siteLive && <PostHogInsightsPanel report={report} />}

          {(summary.summaryLines.length > 0 || summary.teamNote) && (
            <OverviewSummaryCard
              lines={summary.summaryLines}
              teamNote={summary.teamNote}
              tone={headlineTone[summary.headlineType ?? "info"] ?? headlineTone.info}
            />
          )}

          {showIntel && (
            <IntelligenceOverview
              intel={intelligence}
              metricQuality={metricQuality}
              socialReady={socialReady}
            />
          )}

          <PostHighlightsPanel
            weekStart={weekStart}
            postHighlightsJson={postHighlightsJson}
            compact
          />
        </>
      )}

      <div className="flex justify-center border-t border-foreground/[0.06] pt-6">
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary">
          <Link href={periodLink}>
            Platform breakdown, goals & funnel
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
