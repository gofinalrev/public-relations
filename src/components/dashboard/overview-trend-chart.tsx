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
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type OverviewTrendChartProps = {
  history: WeeklyReport[];
  currentWeekKey: string;
};

export function OverviewTrendChart({ history, currentWeekKey }: OverviewTrendChartProps) {
  const recent = history.slice(-8);

  if (recent.length < 2) {
    return null;
  }

  const chartData = recent.map((r) => ({
    week: formatWeekLabel(parseWeekKey(r.week_start)).split(" – ")[0],
    weekKey: r.week_start,
    visitors: r.posthog_visitors,
    subs: r.posthog_subscriptions,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Tooltrace growth</CardTitle>
        <CardDescription>Visitors and Pro subs by period</CardDescription>
      </CardHeader>
      <CardContent className="-mx-1 px-1 sm:mx-0 sm:px-0">
        <div className="h-52 w-full min-w-0 sm:h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <XAxis dataKey="week" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} width={32} tickFormatter={(v) => formatNumber(v)} />
              <Tooltip
                formatter={(value) => formatNumber(Number(value))}
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as { weekKey?: string; week?: string } | undefined;
                  if (row?.weekKey === currentWeekKey) return `${row.week ?? ""} · selected`;
                  return row?.week ?? "";
                }}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 0,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
              <Bar dataKey="visitors" name="Tooltrace visitors" fill="hsl(var(--chart-3))" radius={0} />
              <Bar dataKey="subs" name="Tooltrace Pro" fill="hsl(var(--chart-4, var(--primary)))" radius={0} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
