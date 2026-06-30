import { Suspense } from "react";
import { getDashboardData, getAppSetting, getMetricoolPdfMeta, listMetricoolPdfMetas } from "@/lib/db";
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
import { isGoogleAuthConfigured } from "@/lib/auth/allowed-email";
import { isPostHogConfigured } from "@/lib/posthog/config";
import { getIntegrationStatus, getIntegrationWarnings } from "@/lib/integrations";
import { isStripeConfigured } from "@/lib/stripe/config";
import { isGeminiConfigured } from "@/lib/gemini/config";
import { isYouTubeConfigured } from "@/lib/social/youtube";
import { isMetricoolConfigured } from "@/lib/metricool/config";
import { syncPostHogForWeek } from "@/app/posthog-actions";
import { syncMetricoolForWeek } from "@/app/metricool-actions";
import { syncSocialChannels } from "@/app/social-sync-actions";
import { resolveTeamShareUrl, getSuggestedPinUrl } from "@/lib/team-url";
import type { ActionItem } from "@/lib/action-items";
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
  const overviewSummary = buildOverviewSummary(report, channels, metrics);
  const googleAuth = isGoogleAuthConfigured();

  let subsSource = "Stripe / PostHog";
  if (!isStripeConfigured()) {
    subsSource = "Stripe off · subs may read 0";
  } else if (report?.posthog_funnel_json) {
    try {
      const funnel = JSON.parse(report.posthog_funnel_json) as { subscriptionEventUsed?: string };
      if (funnel.subscriptionEventUsed) subsSource = funnel.subscriptionEventUsed;
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-foreground/[0.06] bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <FinalrevLogo />
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end sm:gap-3">
            <UserMenu />
            <ThemeToggle />
            {!googleAuth && (
              <TeamShareLink
                share={share}
                suggestedPin={suggestedPin}
                isPinned={Boolean(storedTeamUrl?.trim())}
              />
            )}
            <Suspense fallback={<div className="h-9 w-full animate-pulse bg-muted sm:w-40" />}>
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
            subsSource={subsSource}
            history={history}
            postHighlightsJson={report?.post_highlights_json}
          />
        ) : activeView === "period" ? (
          <>
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
                  sublabel={subsSource}
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
            />

            <section>
              <SectionHeader title="Social by platform" />
              <PlatformBreakdown report={report} periodLabel={periodContext.activityLabel} />
            </section>

            <section>
              <SectionHeader title="Channel goals" />
              <ChannelGoals
                channels={channels}
                report={report}
                periodContext={periodContext}
                youtubeApiEnabled={isYouTubeConfigured()}
              />
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
