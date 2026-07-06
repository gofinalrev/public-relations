import { cn, formatNumber, formatDelta } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";

type MetricCardProps = {
  label: string;
  sublabel?: string;
  value: number;
  previous: number | null;
  highlight?: boolean;
  comparisonLabel?: string;
  icon?: LucideIcon;
  historicalContext?: string;
  periodHint?: string;
  variant?: "default" | "compact";
  displayValue?: string;
  hideDelta?: boolean;
  unavailable?: boolean;
};

export function MetricCard({
  label,
  sublabel,
  value,
  previous,
  highlight,
  comparisonLabel = "vs last week",
  icon: Icon,
  historicalContext,
  periodHint = "This period only",
  variant = "default",
  displayValue,
  hideDelta,
  unavailable,
}: MetricCardProps) {
  const compact = variant === "compact";
  const delta = hideDelta || unavailable ? { value: "", positive: null } : formatDelta(value, previous);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-foreground/[0.08] bg-card/80 backdrop-blur-sm transition-all duration-300",
        compact ? "p-3 sm:p-4" : "p-4 sm:p-5",
        !compact && "hover:border-primary/30 hover:shadow-[0_0_32px_-8px_hsl(var(--primary)/0.25)]",
        highlight && !unavailable && "border-primary/40 bg-primary/[0.06] lime-glow",
        unavailable && "border-foreground/[0.06] bg-muted/20 opacity-90",
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100",
          highlight && "opacity-100",
        )}
      />

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "leading-tight font-semibold text-foreground",
              compact ? "text-xs sm:text-sm" : "text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground",
            )}
          >
            {label}
          </p>
          {sublabel && (
            <p
              className={cn(
                "mt-0.5 line-clamp-2 text-muted-foreground",
                compact ? "text-[10px] leading-snug sm:text-xs" : "mt-1 text-xs text-muted-foreground/80",
              )}
            >
              {sublabel}
            </p>
          )}
          {!compact && periodHint && (
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-primary-700 dark:text-primary/70">
              {periodHint}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-lg border border-foreground/[0.06] bg-muted/50 text-primary",
              compact ? "size-7 sm:size-8" : "size-9",
            )}
          >
            <Icon className={compact ? "size-3 sm:size-3.5" : "size-4"} />
          </div>
        )}
      </div>

      <div
        className={cn(
          "mt-2 flex items-end justify-between gap-1.5 sm:mt-2.5 sm:gap-2",
          !compact && "sm:mt-3 md:mt-4",
        )}
      >
        <p
          className={cn(
            "min-w-0 font-bold tabular-nums tracking-tight",
            compact ? "text-xl sm:text-2xl lg:text-3xl" : "text-3xl sm:text-4xl",
            highlight && "text-primary",
          )}
        >
          {displayValue ?? formatNumber(value)}
        </p>
        <DeltaBadge delta={delta} comparisonLabel={comparisonLabel} compact={compact} />
      </div>
      {!compact && historicalContext && (
        <p className="mt-2 border-t border-foreground/[0.06] pt-2 text-[11px] text-muted-foreground">
          {historicalContext}
        </p>
      )}
      {compact && historicalContext && (
        <p className="mt-1.5 line-clamp-2 text-[10px] leading-snug text-muted-foreground">{historicalContext}</p>
      )}
    </div>
  );
}

function DeltaBadge({
  delta,
  comparisonLabel,
  compact,
}: {
  delta: { value: string; positive: boolean | null };
  comparisonLabel: string;
  compact?: boolean;
}) {
  if (delta.positive === null) {
    if (compact) return null;
    return (
      <span className="flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="size-3" />
        {comparisonLabel}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center gap-0.5 rounded-md border px-1 py-0.5 text-[10px] font-semibold sm:px-1.5 sm:text-xs",
        delta.positive
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-destructive/30 bg-destructive/10 text-destructive",
      )}
    >
      {delta.positive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {delta.value}
    </span>
  );
}
