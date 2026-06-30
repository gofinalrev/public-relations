import type { DashboardPeriodContext } from "@/lib/period-context";
import { Badge } from "@/components/ui/badge";
import { CalendarRange, Clock, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

const scopeBadge: Record<string, { label: string; className: string }> = {
  period: {
    label: "This period only",
    className: "border-primary/25 bg-primary/10 text-primary-800 dark:border-primary/30 dark:bg-primary/10 dark:text-primary",
  },
  live: {
    label: "Live total",
    className: "border-foreground/10 bg-muted/50 text-foreground",
  },
  cumulative: {
    label: "All-time",
    className: "border-foreground/10 bg-muted/50 text-foreground",
  },
};

type PeriodScopeBannerProps = {
  context: DashboardPeriodContext;
  variant?: "full" | "compact";
};

export function PeriodScopeBanner({ context, variant = "full" }: PeriodScopeBannerProps) {
  if (variant === "compact") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 border border-foreground/[0.08] bg-card/80 px-3 py-2.5 sm:px-4">
        <div className="flex flex-wrap items-center gap-2">
          <CalendarRange className="size-4 text-primary" />
          <span className="font-semibold">{context.activityLabel}</span>
          {context.isMultiWeekReport && (
            <Badge variant="outline" className="text-[10px] font-normal normal-case">
              Multi-week PDF
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{context.comparisonLabel}</span>
      </div>
    );
  }

  return (
    <div className="border border-foreground/[0.08] bg-card/80 p-3 backdrop-blur-sm sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <CalendarRange className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">Reporting window</h2>
            {context.isMultiWeekReport && (
              <Badge variant="outline" className="text-[10px] font-normal normal-case">
                Multi-week PDF
              </Badge>
            )}
            {!context.isMultiWeekReport && (
              <Badge variant="outline" className="text-[10px] font-normal normal-case">
                Calendar week
              </Badge>
            )}
          </div>
          <p className="mt-1 break-words text-base font-bold tracking-tight sm:text-lg">{context.activityLabel}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Week bucket: {context.weekLabel}
            {context.isCurrentCalendarWeek ? " · current week" : ""}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Clock className="size-3.5 shrink-0" />
          Funnel {context.comparisonLabel.toLowerCase()}
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {context.rows.map((row) => {
          const badge = scopeBadge[row.scope];
          return (
            <div key={row.label} className="border border-foreground/[0.06] bg-muted/20 p-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-xs font-semibold">{row.label}</p>
                <span className={cn("rounded-none border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide", badge.className)}>
                  {badge.label}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium">{row.range}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{row.detail}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PeriodScopeHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <Layers className="size-3 shrink-0" />
      {children}
    </p>
  );
}
