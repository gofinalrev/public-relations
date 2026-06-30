"use client";

import type { WeeklyReport } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardAreaChart } from "@/components/dashboard/dashboard-charts";
import { formatWeekLabel, parseWeekKey } from "@/lib/weeks";

type OverviewTrendChartProps = {
  history: WeeklyReport[];
  currentWeekKey: string;
};

export function OverviewTrendChart({ history }: OverviewTrendChartProps) {
  const recent = history.slice(-8);

  if (recent.length < 2) {
    return null;
  }

  const categories = recent.map((r) => formatWeekLabel(parseWeekKey(r.week_start)).split(" – ")[0]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Tooltrace growth</CardTitle>
        <CardDescription>Visitors and Pro subs by period</CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <DashboardAreaChart
          categories={categories}
          series={[
            {
              name: "Tooltrace visitors",
              data: recent.map((r) => r.posthog_visitors),
              color: "hsl(0 0% 58%)",
            },
            {
              name: "Tooltrace Pro",
              data: recent.map((r) => r.posthog_subscriptions),
              color: "hsl(72 100% 50%)",
            },
          ]}
          height={260}
        />
      </CardContent>
    </Card>
  );
}
