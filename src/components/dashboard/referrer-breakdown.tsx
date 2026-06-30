import type { WeeklyReport } from "@/lib/db";
import { mapReferrersToPlatforms } from "@/lib/utm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import { Share2 } from "lucide-react";

type ReferrerBreakdownProps = {
  report: WeeklyReport | null;
};

export function ReferrerBreakdown({ report }: ReferrerBreakdownProps) {
  if (!report?.posthog_funnel_json) return null;

  let referrers: Array<{ domain: string; visitors: number }> = [];
  try {
    const data = JSON.parse(report.posthog_funnel_json);
    referrers = data.topReferrers ?? [];
  } catch {
    return null;
  }

  if (referrers.length === 0) return null;

  const mapped = mapReferrersToPlatforms(referrers);
  const total = mapped.reduce((s, r) => s + r.visitors, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="size-5 text-primary-700" />
          Traffic to Tooltrace
        </CardTitle>
        <CardDescription>
          Referrers to tooltrace.ai · {formatNumber(total)} visitors
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {mapped.map((row) => {
            const pct = total > 0 ? ((row.visitors / total) * 100).toFixed(0) : "0";
            return (
              <li key={row.domain} className="flex items-center justify-between gap-4 text-sm">
                <span className="font-medium">{row.platform}</span>
                <span className="tabular-nums text-muted-foreground">
                  {formatNumber(row.visitors)} <span className="text-xs">({pct}%)</span>
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
