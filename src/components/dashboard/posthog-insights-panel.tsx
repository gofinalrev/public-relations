import type { WeeklyReport } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber, cn } from "@/lib/utils";
import { buildReportMetricQuality } from "@/lib/metric-trust-server";
import { shouldShowActivationRate, shouldShowConversionRate } from "@/lib/metric-trust";
import { ChevronRight } from "lucide-react";

type FunnelData = {
  funnel?: {
    pageviews: number;
    upload_image: number;
    generate_tool_outline: number;
    download_cad: number;
    subscription_success: number;
  };
  topReferrers?: { domain: string; visitors: number }[];
  funnelUsedInference?: boolean;
  analysis?: {
    conversionRate: number | null;
    activationRate: number | null;
  };
};

type PostHogInsightsPanelProps = {
  report: WeeklyReport | null;
  compact?: boolean;
};

export function PostHogInsightsPanel({ report, compact = false }: PostHogInsightsPanelProps) {
  if (!report?.posthog_funnel_json) return null;

  let funnelData: FunnelData = {};
  try {
    funnelData = JSON.parse(report.posthog_funnel_json) as FunnelData;
  } catch {
    return null;
  }

  const funnel = funnelData.funnel;
  if (!funnel) return null;

  const quality = buildReportMetricQuality(report);
  const funnelInferred = Boolean(funnelData.funnelUsedInference);
  const showConversion = shouldShowConversionRate(quality);
  const showActivation = shouldShowActivationRate(quality, funnelData);
  const analysis = funnelData.analysis;
  const referrers = funnelData.topReferrers?.slice(0, 3) ?? [];

  const steps = [
    { label: "Views", value: funnel.pageviews },
    { label: "Upload", value: funnel.upload_image },
    { label: "Generate", value: funnel.generate_tool_outline },
    { label: "Download", value: funnel.download_cad },
    { label: "Pro", value: report.posthog_subscriptions, highlight: true },
  ];

  const funnelStrip = (
    <div className="-mx-4 overflow-x-auto overscroll-x-contain px-4 scrollbar-thin sm:mx-0 sm:px-0">
      <div className="flex min-w-max items-center gap-1 pb-0.5 sm:gap-1.5">
        {steps.map((step, index) => (
          <div key={step.label} className="flex items-center gap-1 sm:gap-1.5">
            <FunnelStep label={step.label} value={step.value} highlight={step.highlight} />
            {index < steps.length - 1 && (
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/40" aria-hidden />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const body = (
    <div className="space-y-3 sm:space-y-4">
      {funnelInferred && !compact && (
        <p className="text-xs text-muted-foreground">
          Upload and Generate are estimated from pageviews. Download and Pro are measured.
        </p>
      )}
      {funnelStrip}
      {(showConversion || showActivation) && (
        <div className="flex flex-wrap gap-2">
          {showConversion && analysis?.conversionRate != null && (
            <Badge variant="secondary" className="text-xs">
              {analysis.conversionRate.toFixed(1)}% visitor → sub
            </Badge>
          )}
          {showActivation && analysis?.activationRate != null && (
            <Badge variant="secondary" className="text-xs">
              {analysis.activationRate.toFixed(1)}% visitor → upload
            </Badge>
          )}
        </div>
      )}
      {referrers.length > 0 && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          Top referrers:{" "}
          {referrers.map((r, i) => (
            <span key={r.domain}>
              {i > 0 ? " · " : ""}
              {r.domain.replace(/^\$/, "direct")} ({formatNumber(r.visitors)})
            </span>
          ))}
        </p>
      )}
    </div>
  );

  if (compact) {
    return (
      <section>
        <h2 className="mb-3 text-sm font-medium text-foreground">Tooltrace funnel</h2>
        {body}
      </section>
    );
  }

  return (
    <Card className="border-foreground/[0.08]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Tooltrace funnel</CardTitle>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}

function FunnelStep({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "min-w-[4.5rem] rounded-md border border-primary/30 bg-primary/5 px-2.5 py-2 text-center sm:min-w-[5rem] sm:px-3"
          : "min-w-[4.5rem] rounded-md border border-foreground/[0.06] bg-muted/30 px-2.5 py-2 text-center sm:min-w-[5rem] sm:px-3"
      }
    >
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 text-sm font-semibold tabular-nums sm:text-base", highlight && "text-primary")}>
        {formatNumber(value)}
      </p>
    </div>
  );
}
