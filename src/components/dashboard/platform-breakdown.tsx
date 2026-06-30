import type { WeeklyReport } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import { PlatformLogo } from "@/components/dashboard/platform-logo";
import { ExternalLink } from "lucide-react";
import type { MetricoolWeeklyMetrics, PlatformWeeklyStats } from "@/lib/metricool/metrics";

type PlatformBreakdownProps = {
  report: WeeklyReport | null;
  periodLabel?: string | null;
};

export function PlatformBreakdown({ report, periodLabel }: PlatformBreakdownProps) {
  if (!report?.metricool_breakdown_json) {
    return (
      <Card className="border-dashed border-foreground/10">
        <CardHeader>
          <CardTitle>Social by platform</CardTitle>
          <CardDescription>Import a Metricool PDF for per-platform views and engagement.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  let data: MetricoolWeeklyMetrics | null = null;
  try {
    data = JSON.parse(report.metricool_breakdown_json) as MetricoolWeeklyMetrics;
  } catch {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social by platform</CardTitle>
        <CardDescription>
          {periodLabel ? (
            <>
              <span className="font-medium text-foreground">{periodLabel}</span> only. Not lifetime totals.
            </>
          ) : (
            (() => {
              try {
                const d = JSON.parse(report.metricool_breakdown_json) as { periodLabel?: string; source?: string };
                if (d.periodLabel) return `${d.periodLabel}${d.source === "pdf" ? " · from PDF" : ""}`;
              } catch { /* ignore */ }
              return "@gofinalrev channels this period";
            })()
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          {data.platforms.map((p) => (
            <PlatformStatCard key={p.platform} platform={p} />
          ))}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          <Badge variant="default">Total video views: {formatNumber(data.totalVideoViews)}</Badge>
          <Badge variant="secondary">
            Total reach + clicks: {formatNumber(data.totalEngagement)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function PlatformStatCard({ platform: p }: { platform: PlatformWeeklyStats }) {
  const headline = getHeadlineStat(p);

  return (
    <a
      href={p.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 border border-foreground/[0.08] bg-card/60 p-3 transition-colors hover:border-primary/30 hover:bg-card"
    >
      <PlatformLogo platformOrSlug={p.platform} name={p.name} size="lg" className="ring-1 ring-foreground/[0.06]" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-semibold">{p.name}</p>
          <ExternalLink className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <p className="truncate text-[11px] text-muted-foreground">{p.handle}</p>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <span className="text-lg font-bold tabular-nums text-primary">
            {formatNumber(headline.value)}
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {headline.label}
          </span>
        </div>
        <dl className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
          {headline.label !== "Followers" && p.followers > 0 && (
            <StatPill label="Followers" value={p.followers} />
          )}
          {headline.label !== "Video views" && p.videoViews > 0 && (
            <StatPill label="Views" value={p.videoViews} />
          )}
          {p.engagement > 0 && headline.label !== (p.platform === "linkedin" ? "Interactions" : "Engagement") && (
            <StatPill
              label={p.platform === "linkedin" ? "Interactions" : "Engagement"}
              value={p.engagement}
            />
          )}
          {p.impressions > 0 && headline.label !== "Impressions" && (
            <StatPill label="Impressions" value={p.impressions} />
          )}
        </dl>
      </div>
    </a>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <span>
      {label}: <span className="font-medium tabular-nums text-foreground">{formatNumber(value)}</span>
    </span>
  );
}

function getHeadlineStat(p: PlatformWeeklyStats): { label: string; value: number } {
  if (p.videoViews > 0) return { label: "Video views", value: p.videoViews };
  if (p.engagement > 0) {
    return {
      label: p.platform === "linkedin" ? "Interactions" : "Engagement",
      value: p.engagement,
    };
  }
  if (p.impressions > 0) return { label: "Impressions", value: p.impressions };
  return { label: "Followers", value: p.followers };
}
