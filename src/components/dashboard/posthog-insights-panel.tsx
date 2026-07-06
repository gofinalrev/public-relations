import type { WeeklyReport } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import { buildReportMetricQuality } from "@/lib/metric-trust-server";
import { shouldShowActivationRate, shouldShowConversionRate } from "@/lib/metric-trust";
import { ArrowRight } from "lucide-react";

type FunnelData = {
  funnel?: {
    pageviews: number;
    upload_image: number;
    generate_tool_outline: number;
    download_cad: number;
    subscription_success: number;
    usedInference?: boolean;
    stages?: Array<{ stage: string; rawCount: number; displayCount: number; inferred: boolean }>;
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

  const body = (
    <div className="space-y-4">
      {funnelInferred && !compact && (
        <p className="text-xs text-muted-foreground">
          Upload and Generate are estimated. Download CAD and Pro subs are measured.
        </p>
      )}
      <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
        <FunnelStep label="Pageviews" value={funnel.pageviews} />
        <ArrowRight className="mx-auto hidden size-3 rotate-90 text-muted-foreground/50 sm:mx-0 sm:block sm:rotate-0" />
        <FunnelStep label="Upload" value={funnel.upload_image} />
        <ArrowRight className="mx-auto hidden size-3 rotate-90 text-muted-foreground/50 sm:mx-0 sm:block sm:rotate-0" />
        <FunnelStep label="Generate" value={funnel.generate_tool_outline} />
        <ArrowRight className="mx-auto hidden size-3 rotate-90 text-muted-foreground/50 sm:mx-0 sm:block sm:rotate-0" />
        <FunnelStep label="Download" value={funnel.download_cad} />
        <ArrowRight className="mx-auto hidden size-3 rotate-90 text-muted-foreground/50 sm:mx-0 sm:block sm:rotate-0" />
        <FunnelStep label="Pro" value={report.posthog_subscriptions} highlight />
      </div>
      {(showConversion || showActivation) && (
        <div className="flex flex-wrap gap-2">
          {showConversion && analysis?.conversionRate != null && (
            <Badge variant="secondary">{analysis.conversionRate.toFixed(1)}% visitor → sub</Badge>
          )}
          {showActivation && analysis?.activationRate != null && (
            <Badge variant="secondary">{analysis.activationRate.toFixed(1)}% visitor → upload</Badge>
          )}
        </div>
      )}
      {referrers.length > 0 && (
        <p className="text-xs text-muted-foreground">
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

function FunnelStep({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <span
      className={
        highlight
          ? "flex w-full items-center justify-between gap-2 border border-primary/30 bg-primary/5 px-2.5 py-1.5 text-sm font-medium sm:inline-flex sm:w-auto sm:justify-start"
          : "flex w-full items-center justify-between gap-2 border border-foreground/[0.06] bg-muted/30 px-2.5 py-1.5 text-sm sm:inline-flex sm:w-auto sm:justify-start"
      }
    >
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{formatNumber(value)}</span>
    </span>
  );
}
