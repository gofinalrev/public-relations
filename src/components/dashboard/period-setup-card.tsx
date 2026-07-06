import Link from "next/link";
import { ArrowRight, FileUp } from "lucide-react";
import type { MetricoolPdfMeta } from "@/lib/db";
import type { DashboardPeriodContext } from "@/lib/period-context";
import { formatWeekLabel, parseWeekKey } from "@/lib/weeks";
import { MetricoolPdfUpload } from "@/components/dashboard/metricool-pdf-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type PeriodSetupCardProps = {
  weekStart: string;
  context: DashboardPeriodContext;
  pdfMeta: MetricoolPdfMeta | null;
  syncedAt: string | null;
  recentPdfs: MetricoolPdfMeta[];
  lastReportedWeek: string | null;
  periodLink: string;
};

export function PeriodSetupCard({
  weekStart,
  context,
  pdfMeta,
  syncedAt,
  recentPdfs,
  lastReportedWeek,
  periodLink,
}: PeriodSetupCardProps) {
  return (
    <Card className="border-foreground/10">
      <CardContent className="space-y-5 px-5 py-6 sm:px-6 sm:py-7">
        <div className="space-y-2">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <FileUp className="size-5 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">No report for {context.activityLabel}</h2>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Nothing has been imported for this week yet. Drop the Monday Metricool export below to
            populate social views, reach, and platform breakdown. Tooltrace visitors sync from PostHog
            once the PDF anchors the period.
          </p>
        </div>

        <MetricoolPdfUpload
          weekStart={weekStart}
          syncedAt={syncedAt}
          periodLabel={context.activityLabel}
          pdfMeta={pdfMeta}
          recentPdfs={recentPdfs}
        />

        <div className="flex flex-wrap gap-2 border-t border-foreground/[0.06] pt-4">
          <Button variant="secondary" size="sm" asChild>
            <Link href={periodLink}>
              Period tab
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
          {lastReportedWeek && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/?week=${lastReportedWeek}`}>
                Last report: {formatWeekLabel(parseWeekKey(lastReportedWeek))}
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
