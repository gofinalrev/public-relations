import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import type { IntegrationStatus, IntegrationWarning } from "@/lib/integrations";
import { AlertCircle, Info } from "lucide-react";

type DataSyncStatusProps = {
  metricoolSyncedAt: string | null;
  posthogSyncedAt: string | null;
  periodLabel: string | null;
  periodDays: number;
  integrationStatus: IntegrationStatus;
  warnings: IntegrationWarning[];
  /** When true, only show warnings — hide sync/integration badges */
  minimal?: boolean;
};

export function DataSyncStatus({
  metricoolSyncedAt,
  posthogSyncedAt,
  periodLabel,
  periodDays,
  integrationStatus,
  warnings,
  minimal = false,
}: DataSyncStatusProps) {
  const syncBadges: string[] = [];

  if (metricoolSyncedAt) {
    syncBadges.push(
      `PDF ${formatDistanceToNow(new Date(metricoolSyncedAt), { addSuffix: true })}${periodLabel ? ` · ${periodLabel}` : ""}`,
    );
  }

  if (posthogSyncedAt && integrationStatus.posthog) {
    syncBadges.push(`PostHog ${formatDistanceToNow(new Date(posthogSyncedAt), { addSuffix: true })}`);
  }

  if (periodDays > 7) {
    syncBadges.push("Multi-week report");
  }

  const sourceBadges = [
    integrationStatus.posthog && "PostHog ✓",
    integrationStatus.stripe && "Stripe ✓",
    integrationStatus.youtube && "YouTube API ✓",
    integrationStatus.metricoolApi && "Metricool API ✓",
  ].filter(Boolean) as string[];

  const hasContent = minimal
    ? warnings.length > 0
    : syncBadges.length > 0 || warnings.length > 0 || sourceBadges.length > 0;
  if (!hasContent) return null;

  return (
    <div className="space-y-2">
      {!minimal && (syncBadges.length > 0 || sourceBadges.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {syncBadges.map((label) => (
            <Badge key={label} variant="outline" className="text-[10px] font-normal normal-case tracking-normal">
              {label}
            </Badge>
          ))}
          {sourceBadges.map((label) => (
            <Badge key={label} variant="secondary" className="text-[10px] font-normal normal-case tracking-normal">
              {label}
            </Badge>
          ))}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="space-y-1">
          {warnings.map((w) => (
            <p
              key={w.id}
              className={
                w.level === "warning"
                  ? "flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-400"
                  : "flex items-start gap-1.5 text-[11px] text-muted-foreground"
              }
            >
              {w.level === "warning" ? (
                <AlertCircle className="mt-0.5 size-3 shrink-0" />
              ) : (
                <Info className="mt-0.5 size-3 shrink-0" />
              )}
              {w.message}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
