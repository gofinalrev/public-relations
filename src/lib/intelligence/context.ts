import type { WeeklyReport } from "@/lib/db";
import type { MetricoolWeeklyMetrics } from "@/lib/metricool/metrics";

export type ParsedFunnel = {
  analysis?: { conversionRate?: number | null; activationRate?: number | null };
  topReferrers?: { domain: string; visitors: number }[];
  finalrevCadUploads?: number;
  funnel?: {
    pageviews?: number;
    upload_image?: number;
    download_cad?: number;
  };
};

export function parseReportFunnel(report: WeeklyReport | null): ParsedFunnel | null {
  if (!report?.posthog_funnel_json) return null;
  try {
    return JSON.parse(report.posthog_funnel_json) as ParsedFunnel;
  } catch {
    return null;
  }
}

export function parseReportBreakdown(report: WeeklyReport | null): MetricoolWeeklyMetrics | null {
  if (!report?.metricool_breakdown_json) return null;
  try {
    return JSON.parse(report.metricool_breakdown_json) as MetricoolWeeklyMetrics;
  } catch {
    return null;
  }
}

export function quoteValue(): number {
  return Number(process.env.CONTENT_PNL_QUOTE_VALUE ?? 2500);
}

export function proAnnualValue(): number {
  return Number(process.env.CONTENT_PNL_PRO_ANNUAL_VALUE ?? 348);
}

export function extractHook(title: string): string {
  const cleaned = title.replace(/^["']|["']$/g, "").trim();
  const words = cleaned.split(/\s+/).slice(0, 6);
  return words.join(" ");
}

export function shopFloorSignal(title: string): boolean {
  const lower = title.toLowerCase();
  return /cnc|datron|machine|shop|mill|lathe|tool|spindle|chip|aluminum|steel|robot/i.test(lower);
}

export function aestheticSignal(title: string): boolean {
  const lower = title.toLowerCase();
  return /aesthetic|edit|render|ai art|midjourney|visual/i.test(lower);
}
