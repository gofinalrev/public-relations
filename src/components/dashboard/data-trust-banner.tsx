import { AlertCircle } from "lucide-react";
import type { ReportMetricQuality } from "@/lib/metric-trust";
import { getDataTrustWarnings } from "@/lib/metric-trust";
import type { DashboardPeriodContext } from "@/lib/period-context";

type DataTrustBannerProps = {
  quality: ReportMetricQuality;
  context?: DashboardPeriodContext;
  className?: string;
};

export function DataTrustBanner({ quality, context, className }: DataTrustBannerProps) {
  const warnings = getDataTrustWarnings(quality, context);
  if (warnings.length === 0) return null;

  return (
    <div
      className={`rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-900 dark:text-amber-200 ${className ?? ""}`}
    >
      <p className="flex items-center gap-2 font-medium">
        <AlertCircle className="size-4 shrink-0" />
        Data notes for this period
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed opacity-90">
        {warnings.map((w) => (
          <li key={w}>{w}</li>
        ))}
      </ul>
    </div>
  );
}
