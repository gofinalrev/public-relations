"use client";

import type { WeeklyReport } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatWeekLabel, parseWeekKey } from "@/lib/weeks";
import { formatNumber } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Lightbulb } from "lucide-react";

export function TrendsChart({ history, currentWeekKey }: { history: WeeklyReport[]; currentWeekKey?: string }) {
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
    weekKey: r.week_start,
    views: r.metricool_video_views,
    engagement: r.metricool_engagement,
    visitors: r.posthog_visitors,
    subs: r.posthog_subscriptions,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>12-week trends</CardTitle>
        <CardDescription className="text-xs leading-relaxed sm:text-sm">
          Each bar is one logged week. Period totals only, not live followers.
        </CardDescription>
      </CardHeader>
      <CardContent className="-mx-1 px-1 sm:mx-0 sm:px-0">
        <div className="h-64 w-full min-w-0 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 4, left: -20, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
                className="text-muted-foreground"
              />
              <YAxis tick={{ fontSize: 10 }} width={36} tickFormatter={(v) => formatNumber(v)} />
              <Tooltip
                formatter={(value) => formatNumber(Number(value))}
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as { weekKey?: string; week?: string } | undefined;
                  if (row?.weekKey && row.weekKey === currentWeekKey) {
                    return `${row.week ?? ""} · selected week`;
                  }
                  return row?.week ?? "";
                }}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 0,
                  fontSize: 12,
                  maxWidth: "90vw",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar dataKey="views" name="Video Views" fill="hsl(var(--chart-1))" radius={0} />
              <Bar dataKey="engagement" name="Engagement" fill="hsl(var(--chart-2))" radius={0} />
              <Bar dataKey="visitors" name="Tooltrace visitors" fill="hsl(var(--chart-3))" radius={0} />
              <Bar dataKey="subs" name="Tooltrace Pro" fill="hsl(var(--chart-4))" radius={0} />
            </BarChart>
          </ResponsiveContainer>
        </div>
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
        <CardDescription>All recorded weeks — each row is that week&apos;s period totals only.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto overscroll-x-contain">
        <table className="w-full min-w-[36rem] text-sm">
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
                <td className="p-3 tabular-nums">{formatNumber(r.metricool_video_views)}</td>
                <td className="p-3 tabular-nums">{formatNumber(r.metricool_engagement)}</td>
                <td className="p-3 tabular-nums">{formatNumber(r.posthog_visitors)}</td>
                <td className="p-3 tabular-nums font-semibold text-primary-700">
                  {formatNumber(r.posthog_subscriptions)}
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
