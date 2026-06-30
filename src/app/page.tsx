import { Suspense } from "react";
import { getDashboardData, getAppSetting, getMetricoolPdfMeta, listMetricoolPdfMetas, setAppSetting } from "@/lib/db";
import { getCurrentWeekKey } from "@/lib/weeks";
import { buildDashboardPeriodContext } from "@/lib/period-context";
import { analyzeHistory } from "@/lib/history-analytics";
import { formatNumber } from "@/lib/utils";
import { FinalrevLogo } from "@/components/dashboard/logo";
import { WeekSelector } from "@/components/dashboard/week-selector";
import { DashboardViewTabs } from "@/components/dashboard/dashboard-view-tabs";
import { PeriodScopeBanner } from "@/components/dashboard/period-scope-banner";
import { WeekContextStrip } from "@/components/dashboard/week-context-strip";
import { PrBriefPanel } from "@/components/dashboard/pr-brief-panel";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ChannelGoals } from "@/components/dashboard/channel-goals";
import { WeeklyEntryForm } from "@/components/dashboard/weekly-entry-form";
import { TrendsChart, LearningsLog, HistoryTable } from "@/components/dashboard/trends-and-history";
import { PlatformMomentumPanel } from "@/components/dashboard/platform-momentum-panel";
import { MetricoolPdfUpload } from "@/components/dashboard/metricool-pdf-upload";
import { OverviewView } from "@/components/dashboard/overview-view";
import { PostHighlightsPanel } from "@/components/dashboard/post-highlights-panel";
import { buildOverviewSummary } from "@/lib/overview-summary";
import { PostHogInsightsPanel } from "@/components/dashboard/posthog-insights-panel";
import { PlatformBreakdown } from "@/components/dashboard/platform-breakdown";
import { ActionItemsPanel } from "@/components/dashboard/action-items-panel";
import { PrToolkitView } from "@/components/dashboard/pr-toolkit-view";
import { ReferrerBreakdown } from "@/components/dashboard/referrer-breakdown";
import { DataSyncStatus } from "@/components/dashboard/data-sync-status";
import { TeamShareLink } from "@/components/dashboard/team-share-link";
import { UserMenu } from "@/components/dashboard/user-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { SectionHeader } from "@/components/dashboard/section-header";
import { isAuthConfigured } from "@/lib/auth/allowed-email";
import { isPostHogConfigured } from "@/lib/posthog/config";
import { getIntegrationStatus, getIntegrationWarnings, getIntegrationOpsNotes } from "@/lib/integrations";
import { OpsLogSink } from "@/components/dashboard/ops-log-sink";
import { executiveSubsLabel, logOps } from "@/lib/ops-log";
import { isGeminiConfigured } from "@/lib/gemini/config";
import { buildCaptionWeekContext } from "@/lib/gemini/caption-prompt";
import { isMetricoolConfigured } from "@/lib/metricool/config";
import { syncPostHogForWeek } from "@/app/posthog-actions";
import { syncMetricoolForWeek } from "@/app/metricool-actions";
import { syncSocialChannels } from "@/app/social-sync-actions";
import { loadOrBuildIntelligence } from "@/lib/intelligence/persist";
import { postWarRoomAlert } from "@/lib/slack/weekly-digest";
import { resolveTeamShareUrl, getSuggestedPinUrl, PRODUCTION_TEAM_URL } from "@/lib/team-url";
import type { ActionItem } from "@/lib/action-items";
import { WeeklyChecklist } from "@/components/dashboard/weekly-checklist";
import { parsePostHighlights } from "@/lib/post-highlights";
import { Play, MousePointerClick, Users, Crown } from "lucide-react";

type PageProps = {
  searchParams: Promise<{ week?: string; view?: string }>;
};

function historicalContext(avg4: number, sum12: number): string {
  return `4-wk avg ${formatNumber(Math.round(avg4))} · 12-wk ${formatNumber(sum12)}`;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const weekStart = params.week ?? getCurrentWeekKey();
  const activeView =
    params.view === "period"
      ? "period"
      : params.view === "trends"
        ? "trends"
        : params.view === "toolkit"
          ? "toolkit"
          : "overview";

  await syncSocialChannels();

  if (isPostHogConfigured()) {
    await syncPostHogForWeek(weekStart);
  }

  if (isMetricoolConfigured()) {
    await syncMetricoolForWeek(weekStart);
  }

  const { report, previousWeek, history, channels } = await getDashboardData(weekStart);
  const [pdfMeta, recentPdfs] = await Promise.all([
    getMetricoolPdfMeta(weekStart),
    listMetricoolPdfMetas(12),
  ]);
  const periodContext = buildDashboardPeriodContext(weekStart, report);
  const analytics = analyzeHistory(history, weekStart, previousWeek);

  const periodLabel: string | null = periodContext.activityLabel;
  const periodDays = periodContext.periodDays;

  let actionItems: ActionItem[] = [];
  if (report?.action_items_json) {
    try {
      actionItems = JSON.parse(report.action_items_json);
    } catch {
      actionItems = [];
    }
  }

  const metrics = {
    views: report?.metricool_video_views ?? 0,
    engagement: report?.metricool_engagement ?? 0,
    visitors: report?.posthog_visitors ?? 0,
    subs: report?.posthog_subscriptions ?? 0,
  };

  const prev = previousWeek
    ? {
        views: previousWeek.metricool_video_views,
        engagement: previousWeek.metricool_engagement,
        visitors: previousWeek.posthog_visitors,
        subs: previousWeek.posthog_subscriptions,
      }
    : null;

  const storedTeamUrl = await getAppSetting("team_public_url");
  const share = resolveTeamShareUrl(storedTeamUrl);
  const suggestedPin = getSuggestedPinUrl();

  const integrationStatus = getIntegrationStatus(report);
  const integrationWarnings = getIntegrationWarnings(integrationStatus);
  const integrationOpsNotes = getIntegrationOpsNotes(integrationStatus);
  for (const note of integrationOpsNotes) {
    logOps(note);
  }
  const overviewSummary = buildOverviewSummary(report, channels, metrics, prev);
  const intelligence = await loadOrBuildIntelligence({
    weekStart,
    report,
    previousReport: previousWeek,
    history,
    channels,
    context: periodContext,
  });

  if (intelligence.warRoom?.active && report) {
    const warKey = `war_room_sent_${weekStart}`;
    const already = await getAppSetting(warKey);
    if (!already) {
      const hub = process.env.APP_PUBLIC_URL?.trim() || PRODUCTION_TEAM_URL;
      if (await postWarRoomAlert({ ...report, intelligence_json: JSON.stringify(intelligence) }, hub)) {
        await setAppSetting(warKey, new Date().toISOString());
      }
    }
  }

  const authEnabled = isAuthConfigured();
  const postsLogged = parsePostHighlights(report?.post_highlights_json).length;

  return (
    <>
      <OpsLogSink messages={integrationOpsNotes} />
      <header className="sticky top-0 z-30 border-b border-foreground/[0.06] bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-6xl px-3 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <FinalrevLogo />
            <div className="flex items-center gap-1.5 sm:gap-2">
              <UserMenu />
              <ThemeToggle />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {!authEnabled && (
              <TeamShareLink
                share={share}
                suggestedPin={suggestedPin}
                isPinned={Boolean(storedTeamUrl?.trim())}
              />
            )}
            <Suspense fallback={<div className="h-10 flex-1 animate-pulse rounded-lg bg-muted sm:max-w-xs" />}>
              <WeekSelector weekStart={weekStart} />
            </Suspense>
          </div>
        </div>
      </header>

      <main className="safe-bottom mx-auto max-w-6xl space-y-5 px-3 py-5 sm:space-y-6 sm:px-6 sm:py-6">
        <Suspense fallback={null}>
          <DashboardViewTabs weekStart={weekStart} activeView={activeView} />
        </Suspense>

        {activeView === "overview" ? (
          <OverviewView
            weekStart={weekStart}
            context={periodContext}
            pdfMeta={pdfMeta}
            summary={overviewSummary}
            metrics={metrics}
            prev={prev}
            history={history}
            postHighlightsJson={report?.post_highlights_json}
            intelligence={intelligence}
            postsLogged={postsLogged}
          />
        ) : activeView === "period" ? (
          <>
            <WeeklyChecklist hasPdf={Boolean(pdfMeta)} postsLogged={postsLogged} />
            <PeriodScopeBanner context={periodContext} variant="compact" />

            <MetricoolPdfUpload
              weekStart={weekStart}
              syncedAt={report?.metricool_synced_at ?? null}
              periodLabel={periodLabel}
              pdfMeta={pdfMeta}
              recentPdfs={recentPdfs}
            />
            <DataSyncStatus
              metricoolSyncedAt={report?.metricool_synced_at ?? null}
              posthogSyncedAt={report?.posthog_synced_at ?? null}
              periodLabel={periodLabel}
              periodDays={periodDays}
              integrationStatus={integrationStatus}
              warnings={integrationWarnings}
              minimal
            />

            <section>
              <SectionHeader title="Metrics" />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  label="Video views"
                  sublabel="Social"
                  value={metrics.views}
                  previous={periodContext.showWeekOverWeek ? (prev?.views ?? null) : null}
                  comparisonLabel={periodContext.comparisonLabel}
                  icon={Play}
                  variant="compact"
                  historicalContext={historicalContext(
                    analytics.trailing4Avg.views,
                    analytics.trailing12Sum.views,
                  )}
                />
                <MetricCard
                  label="Reach + clicks"
                  sublabel="Social"
                  value={metrics.engagement}
                  previous={periodContext.showWeekOverWeek ? (prev?.engagement ?? null) : null}
                  comparisonLabel={periodContext.comparisonLabel}
                  icon={MousePointerClick}
                  variant="compact"
                  historicalContext={historicalContext(
                    analytics.trailing4Avg.engagement,
                    analytics.trailing12Sum.engagement,
                  )}
                />
                <MetricCard
                  label="Tooltrace visitors"
                  value={metrics.visitors}
                  previous={periodContext.showWeekOverWeek ? (prev?.visitors ?? null) : null}
                  comparisonLabel={periodContext.comparisonLabel}
                  icon={Users}
                  variant="compact"
                  historicalContext={historicalContext(
                    analytics.trailing4Avg.visitors,
                    analytics.trailing12Sum.visitors,
                  )}
                />
                <MetricCard
                  label="Pro subscriptions"
                  sublabel={executiveSubsLabel()}
                  value={metrics.subs}
                  previous={periodContext.showWeekOverWeek ? (prev?.subs ?? null) : null}
                  highlight
                  comparisonLabel={periodContext.comparisonLabel}
                  icon={Crown}
                  variant="compact"
                  historicalContext={historicalContext(
                    analytics.trailing4Avg.subs,
                    analytics.trailing12Sum.subs,
                  )}
                />
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <PrBriefPanel
                context={periodContext}
                report={report}
                previousWeek={previousWeek}
                history={history}
              />
              <ActionItemsPanel weekStart={weekStart} items={actionItems} />
            </section>

            <PostHighlightsPanel
              weekStart={weekStart}
              postHighlightsJson={report?.post_highlights_json}
              autopsies={intelligence.autopsies}
            />

            <section>
              <SectionHeader title="Social by platform" />
              <PlatformBreakdown report={report} periodLabel={periodContext.activityLabel} />
            </section>

            <section>
              <SectionHeader title="Channel goals" />
              <ChannelGoals channels={channels} report={report} periodContext={periodContext} />
            </section>

            <section>
              <SectionHeader title="Tooltrace funnel" />
              <div className="grid gap-4 lg:grid-cols-2">
                <PostHogInsightsPanel report={report} />
                <ReferrerBreakdown report={report} />
              </div>
            </section>

            <section>
              <SectionHeader title="Notes" description="Learnings saved with this period" />
              <WeeklyEntryForm weekStart={weekStart} report={report} autoSynced={Boolean(report?.metricool_synced_at)} />
            </section>
          </>
        ) : activeView === "toolkit" ? (
          <>
            <WeekContextStrip context={periodContext} />
            <PrToolkitView
              weekStart={weekStart}
              report={report}
              channels={channels}
              context={periodContext}
              geminiConfigured={isGeminiConfigured()}
              intelligence={intelligence}
              weekContextSummary={buildCaptionWeekContext(report, channels, periodContext).summary}
            />
          </>
        ) : (
          <>
            <WeekContextStrip context={periodContext} />
            <section>
              <TrendsChart history={history} currentWeekKey={weekStart} />
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <PlatformMomentumPanel history={history} currentWeekKey={weekStart} />
                <LearningsLog history={history} />
              </div>
              <div className="mt-4">
                <HistoryTable history={history} />
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}
