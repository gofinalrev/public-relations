import Link from "next/link";
import type { MetricoolPdfMeta } from "@/lib/db";
import type { OverviewViewProps } from "@/lib/overview-summary";
import type { WeeklyIntelligence } from "@/lib/intelligence/types";
import type { ReportMetricQuality } from "@/lib/metric-trust";
import { resolveProSubsDisplay } from "@/lib/metric-trust";
import { pdfDownloadUrl, pdfViewUrl } from "@/lib/overview-summary";
import { findLatestReportedWeek, periodHasReportData } from "@/lib/period-readiness";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PostHighlightsPanel } from "@/components/dashboard/post-highlights-panel";
import { IntelligenceOverview } from "@/components/dashboard/intelligence/intelligence-overview";
import { SectionHeader } from "@/components/dashboard/section-header";
import { Button } from "@/components/ui/button";
import { OverviewSummaryCard } from "@/components/dashboard/overview-summary-card";
import { DataTrustBanner } from "@/components/dashboard/data-trust-banner";
import { PeriodSetupCard } from "@/components/dashboard/period-setup-card";
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
  syncedAt = null,
  recentPdfs = [],
}: OverviewViewProps & {
  intelligence: WeeklyIntelligence;
  postsLogged?: number;
  metricQuality: ReportMetricQuality;
  syncedAt?: string | null;
  recentPdfs?: MetricoolPdfMeta[];
}) {
  const proSubs = resolveProSubsDisplay(metrics.subs, metricQuality);
  const periodLink =
    weekStart !== context.weekKey ? `/?view=period&week=${weekStart}` : "/?view=period";
  const cadUploads = summary.finalrevCadUploads ?? 0;
  const showDelta = context.showWeekOverWeek;
  const postsCount = postsLogged || parsePostHighlights(postHighlightsJson).length;
  const hasPeriodData = periodHasReportData({
    pdfMeta,
    metricQuality,
    postsLogged: postsCount,
    metrics,
  });
  const lastReportedWeek = findLatestReportedWeek(history, weekStart);

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
            {context.isMultiWeekReport ? " · Metricool PDF" : ""}
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

      {!hasPeriodData ? (
        <PeriodSetupCard
          weekStart={weekStart}
          context={context}
          pdfMeta={pdfMeta}
          syncedAt={syncedAt}
          recentPdfs={recentPdfs}
          lastReportedWeek={lastReportedWeek?.week_start ?? null}
          periodLink={periodLink}
        />
      ) : (
        <>
          <DataTrustBanner
            quality={metricQuality}
            context={context}
            includeGlobalConfig={false}
          />

          {(summary.summaryLines.length > 0 || summary.teamNote) && (
            <OverviewSummaryCard
              lines={summary.summaryLines}
              teamNote={summary.teamNote}
              tone={headlineTone[summary.headlineType ?? "info"] ?? headlineTone.info}
            />
          )}

          <IntelligenceOverview intel={intelligence} metricQuality={metricQuality} />

          <section>
            <SectionHeader title="Key numbers" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <MetricCard
                label="Video views"
                sublabel="Metricool · social"
                value={metrics.views}
                previous={showDelta ? (prev?.views ?? null) : null}
                comparisonLabel={context.comparisonLabel}
                icon={Play}
                variant="compact"
              />
              <MetricCard
                label="Reach + clicks"
                sublabel="Metricool · social"
                value={metrics.engagement}
                previous={showDelta ? (prev?.engagement ?? null) : null}
                comparisonLabel={context.comparisonLabel}
                icon={MousePointerClick}
                variant="compact"
              />
              <MetricCard
                label="Tooltrace visitors"
                sublabel="PostHog · unique"
                value={metrics.visitors}
                previous={showDelta ? (prev?.visitors ?? null) : null}
                comparisonLabel={context.comparisonLabel}
                icon={Users}
                variant="compact"
              />
              <MetricCard
                label="Pro subscriptions"
                sublabel={proSubs.sublabel}
                value={metrics.subs}
                displayValue={proSubs.displayValue}
                hideDelta={!proSubs.showDelta}
                unavailable={proSubs.unavailable}
                previous={showDelta && proSubs.showDelta ? (prev?.subs ?? null) : null}
                highlight={!proSubs.unavailable}
                comparisonLabel={context.comparisonLabel}
                icon={Crown}
                variant="compact"
              />
              <MetricCard
                label="STEP uploads"
                sublabel="PostHog · finalrev.com"
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
