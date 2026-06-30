import type { WeeklyReport } from "@/lib/db";
import { analyzeHistory } from "@/lib/history-analytics";
import { SOCIAL_PLATFORMS, type SocialPlatformSlug } from "@/lib/platforms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformLogo } from "@/components/dashboard/platform-logo";
import { formatNumber } from "@/lib/utils";
import { Share2 } from "lucide-react";

type PlatformMomentumPanelProps = {
  history: WeeklyReport[];
  currentWeekKey: string;
};

export function PlatformMomentumPanel({ history, currentWeekKey }: PlatformMomentumPanelProps) {
  const analytics = analyzeHistory(history, currentWeekKey, null);
  const entries = Object.entries(analytics.platformTotals)
    .filter(([, stats]) => stats && (stats.videoViews > 0 || stats.engagement > 0))
    .sort((a, b) => (b[1]?.videoViews ?? 0) - (a[1]?.videoViews ?? 0)) as [
    SocialPlatformSlug,
    { videoViews: number; engagement: number; weeks: number },
  ][];

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="size-5 text-primary-700" />
            Platform momentum
          </CardTitle>
          <CardDescription>Aggregated from logged weekly PDFs — shows where video views stack over time.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No platform breakdown history yet. Import Metricool PDFs each week to build this view.</p>
        </CardContent>
      </Card>
    );
  }

  const maxViews = entries[0]?.[1].videoViews ?? 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="size-5 text-primary-700" />
          Platform momentum
        </CardTitle>
        <CardDescription>
          Sum of video views across {analytics.weeksRecorded} logged weeks — zoomed-out view of which channels carry reach.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.map(([slug, stats]) => {
          const meta = SOCIAL_PLATFORMS[slug];
          const share = maxViews > 0 ? (stats.videoViews / maxViews) * 100 : 0;
          return (
            <div key={slug} className="flex items-center gap-3">
              <PlatformLogo platformOrSlug={slug} name={meta.name} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-semibold">{meta.name}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatNumber(stats.videoViews)} views · {stats.weeks} wk{stats.weeks === 1 ? "" : "s"} w/ data
                  </span>
                </div>
                <div className="mt-1.5 h-2 bg-muted">
                  <div className="h-full bg-primary/80" style={{ width: `${share}%` }} />
                </div>
                {stats.engagement > 0 && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {formatNumber(stats.engagement)} total reach + clicks logged
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
