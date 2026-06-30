import type { WeeklyReport } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import { filterExecutiveInsights } from "@/lib/ops-log";
import { Brain, ArrowRight } from "lucide-react";

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
  subscriptionEventUsed?: string;
  funnelEventSources?: string;
  funnelUsedInference?: boolean;
  analysis?: {
    conversionRate: number | null;
    activationRate: number | null;
    suggestedFindings: string[];
  };
};

type PostHogInsightsPanelProps = {
  report: WeeklyReport | null;
};

const insightVariant: Record<string, "default" | "warning" | "success" | "secondary"> = {
  CRITICAL: "warning",
  WARNING: "warning",
  SUCCESS: "success",
  INFO: "secondary",
};

export function PostHogInsightsPanel({ report }: PostHogInsightsPanelProps) {
  if (!report?.posthog_insights && !report?.posthog_funnel_json) {
    return (
      <Card className="border-dashed border-foreground/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="size-5 text-muted-foreground" />
            Site metrics
          </CardTitle>
          <CardDescription>Tooltrace funnel and conversion for this period.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  let funnelData: FunnelData = {};
  try {
    funnelData = JSON.parse(report.posthog_funnel_json || "{}") as FunnelData;
  } catch {
    funnelData = {};
  }

  const insights = filterExecutiveInsights(parseInsights(report.posthog_insights));
  const funnel = funnelData.funnel;
  const analysis = funnelData.analysis;

  return (
    <Card className="border-primary/15">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="size-5 text-primary" />
          Tooltrace site metrics
        </CardTitle>
        <CardDescription>
          Tooltrace.ai funnel only (excludes finalrev.com)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {funnel && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Tooltrace funnel
            </p>
            <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
              <FunnelStep label="Pageviews" value={funnel.pageviews} />
              <ArrowRight className="mx-auto hidden size-3 rotate-90 text-muted-foreground sm:mx-0 sm:block sm:rotate-0" />
              <FunnelStep
                label="Upload"
                value={funnel.upload_image}
                hint={funnel.stages?.find((s) => s.stage === "upload")?.inferred ? "≥ downloads" : undefined}
              />
              <ArrowRight className="mx-auto hidden size-3 rotate-90 text-muted-foreground sm:mx-0 sm:block sm:rotate-0" />
              <FunnelStep
                label="Generate"
                value={funnel.generate_tool_outline}
                hint={funnel.stages?.find((s) => s.stage === "generate")?.inferred ? "≥ downloads" : undefined}
              />
              <ArrowRight className="mx-auto hidden size-3 rotate-90 text-muted-foreground sm:mx-0 sm:block sm:rotate-0" />
              <FunnelStep label="Download CAD" value={funnel.download_cad} />
              <ArrowRight className="mx-auto hidden size-3 rotate-90 text-muted-foreground sm:mx-0 sm:block sm:rotate-0" />
              <FunnelStep label="Pro signup" value={report.posthog_subscriptions} highlight />
            </div>
            {analysis && (
              <div className="mt-3 flex flex-wrap gap-2">
                {analysis.conversionRate !== null && (
                  <Badge variant="default">{analysis.conversionRate.toFixed(1)}% visitor → sub</Badge>
                )}
                {analysis.activationRate !== null && (
                  <Badge variant="secondary">{analysis.activationRate.toFixed(1)}% visitor → upload</Badge>
                )}
              </div>
            )}
          </div>
        )}

        {insights.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Site insights
            </p>
            {insights.slice(0, 3).map((insight, i) => (
              <div key={i} className="border border-border bg-muted/30 p-3">
                <div className="mb-1 flex items-center gap-2">
                  <Badge variant={insightVariant[insight.type] ?? "secondary"}>{insight.type}</Badge>
                  <span className="text-sm font-semibold">{insight.title}</span>
                </div>
                <p className="text-sm text-muted-foreground">{insight.body}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FunnelStep({
  label,
  value,
  highlight,
  hint,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  hint?: string;
}) {
  return (
    <span
      className={
        highlight
          ? "flex w-full items-center justify-between gap-2 border border-primary/40 bg-primary/10 px-2.5 py-1.5 text-sm font-semibold text-primary sm:inline-flex sm:w-auto sm:justify-start sm:py-1"
          : "flex w-full items-center justify-between gap-2 border border-foreground/[0.06] bg-muted/50 px-2.5 py-1.5 text-sm sm:inline-flex sm:w-auto sm:justify-start sm:py-1"
      }
    >
      {label}: {formatNumber(value)}
      {hint && <span className="ml-1 text-[10px] font-normal opacity-70">({hint})</span>}
    </span>
  );
}

function parseInsights(raw: string): { type: string; title: string; body: string }[] {
  if (!raw.trim()) return [];

  return raw.split("\n\n").map((block) => {
    const match = block.match(/^\[(\w+)\]\s([^:]+):\s([\s\S]+)$/);
    if (!match) return { type: "INFO", title: "Insight", body: block };
    return { type: match[1], title: match[2].trim(), body: match[3].trim() };
  });
}
