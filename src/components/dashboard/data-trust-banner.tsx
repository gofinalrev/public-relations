import type { ReportMetricQuality } from "@/lib/metric-trust";
import { getDataTrustWarnings } from "@/lib/metric-trust";
import type { DashboardPeriodContext } from "@/lib/period-context";

type DataTrustBannerProps = {
  quality: ReportMetricQuality;
  context?: DashboardPeriodContext;
  className?: string;
  includeGlobalConfig?: boolean;
  includeSocialPending?: boolean;
};

export function DataTrustBanner({
  quality,
  context,
  className,
  includeGlobalConfig = true,
  includeSocialPending = true,
}: DataTrustBannerProps) {
  const warnings = getDataTrustWarnings(quality, context, {
    includeGlobalConfig,
    includeSocialPending,
  }).slice(0, 2);
  if (warnings.length === 0) return null;

  return (
    <div className={`text-xs leading-relaxed text-muted-foreground ${className ?? ""}`}>
      {warnings.map((w) => (
        <p key={w}>{w}</p>
      ))}
    </div>
  );
}
