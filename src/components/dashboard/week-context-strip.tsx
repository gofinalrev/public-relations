import type { DashboardPeriodContext } from "@/lib/period-context";

type WeekContextStripProps = {
  context: DashboardPeriodContext;
  note?: string;
};

/** Lightweight week reminder on Toolkit / Trends */
export function WeekContextStrip({ context, note }: WeekContextStripProps) {
  return (
    <p className="text-sm text-muted-foreground">
      <span className="font-medium text-foreground">{context.activityLabel}</span>
      {note ? ` · ${note}` : ""}
    </p>
  );
}
