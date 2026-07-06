"use client";

import type { WeeklyReport } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardBarChart } from "@/components/dashboard/dashboard-charts";
import { formatWeekLabel, parseWeekKey } from "@/lib/weeks";
import { Lightbulb } from "lucide-react";
import { useEffect, useState } from "react";

function useTrendChartHeight() {
  const [height, setHeight] = useState(280);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setHeight(w < 640 ? 240 : w < 1024 ? 280 : 300);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return height;
}

export function TrendsChart({ history }: { history: WeeklyReport[]; currentWeekKey?: string }) {
  const chartHeight = useTrendChartHeight();

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>12-week trends</CardTitle>
          <CardDescription>Charts appear once you log a few weeks of data.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const chartData = history.map((r) => ({
    week: formatWeekLabel(parseWeekKey(r.week_start)).split(" – ")[0],
    views: r.metricool_video_views,
    engagement: r.metricool_engagement,
    visitors: r.posthog_visitors,
    subs: r.posthog_subscriptions,
  }));

  const categories = chartData.map((d) => d.week);

  return (
    <Card>
      <CardHeader>
        <CardTitle>12-week trends</CardTitle>
        <CardDescription className="text-xs leading-relaxed sm:text-sm">
          Each bar is one logged week. Period totals only, not live followers.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <DashboardBarChart
          categories={categories}
          series={[
            { name: "Social views", data: chartData.map((d) => d.views), color: "hsl(72 100% 50%)" },
            { name: "Social reach", data: chartData.map((d) => d.engagement), color: "hsl(72 70% 42%)" },
            { name: "Tooltrace visitors", data: chartData.map((d) => d.visitors), color: "hsl(0 0% 55%)" },
            { name: "Tooltrace Pro", data: chartData.map((d) => d.subs), color: "hsl(72 100% 35%)" },
          ]}
          height={chartHeight}
        />
      </CardContent>
    </Card>
  );
}

export function LearningsLog({ history }: { history: WeeklyReport[] }) {
  const withLearnings = [...history].reverse().filter((r) => r.learning || r.locked_findings);

  if (withLearnings.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="size-5 text-primary-700" />
          Learnings archive
        </CardTitle>
        <CardDescription>Past one-liners and locked-in decisions.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {withLearnings.map((r) => (
            <div key={r.week_start} className="border-l-2 border-primary-700 pl-4">
              <p className="text-xs font-medium text-muted-foreground">
                Week of {formatWeekLabel(parseWeekKey(r.week_start))}
              </p>
              {r.learning && <p className="mt-1 text-sm">{r.learning}</p>}
              {r.locked_findings && (
                <p className="mt-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Locked in:</span> {r.locked_findings}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function HistoryTable({ history }: { history: WeeklyReport[] }) {
  if (history.length === 0) return null;

  const rows = [...history].reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly log</CardTitle>
        <CardDescription>Each row shows that week&apos;s period totals.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto overscroll-x-contain">
        <table className="w-full min-w-[32rem] text-sm sm:min-w-[36rem]">
          <thead>
            <tr className="border-b border-border bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="p-3 font-medium">Week</th>
              <th className="p-3 font-medium">Social views</th>
              <th className="p-3 font-medium">Social reach</th>
              <th className="p-3 font-medium">Tooltrace visitors</th>
              <th className="p-3 font-medium">Tooltrace Pro</th>
              <th className="p-3 font-medium">Learning</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.week_start} className="border-b border-border hover:bg-muted/50">
                <td className="p-3 font-medium whitespace-nowrap">
                  {formatWeekLabel(parseWeekKey(r.week_start))}
                </td>
                <td className="p-3 tabular-nums">{r.metricool_video_views.toLocaleString()}</td>
                <td className="p-3 tabular-nums">{r.metricool_engagement.toLocaleString()}</td>
                <td className="p-3 tabular-nums">{r.posthog_visitors.toLocaleString()}</td>
                <td className="p-3 tabular-nums font-semibold text-primary-700">
                  {r.posthog_subscriptions.toLocaleString()}
                </td>
                <td className="max-w-xs truncate p-3 text-muted-foreground">{r.learning || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
