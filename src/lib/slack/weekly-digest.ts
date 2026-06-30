import type { WeeklyReport } from "@/lib/db";
import type { DashboardPeriodContext } from "@/lib/period-context";
import { parseStoredInsights } from "@/lib/action-items";
import { formatNumber } from "@/lib/utils";
import { PRODUCTION_TEAM_URL } from "@/lib/team-url";

type DigestInput = {
  weekStart: string;
  report: WeeklyReport;
  context: DashboardPeriodContext;
  source: "pdf" | "metricool-api" | "cron";
};

function topInsight(report: WeeklyReport): string | null {
  const growth = parseStoredInsights(report.growth_insights ?? "");
  const posthog = parseStoredInsights(report.posthog_insights ?? "");
  const top = [...growth, ...posthog].find(
    (i) => i.type === "critical" || i.type === "warning" || i.type === "success",
  );
  if (!top) return null;
  return `${top.title} — ${top.body.slice(0, 120)}${top.body.length > 120 ? "…" : ""}`;
}

function openActionCount(report: WeeklyReport): number {
  try {
    const items = JSON.parse(report.action_items_json || "[]") as { done?: boolean }[];
    return items.filter((i) => !i.done).length;
  } catch {
    return 0;
  }
}

export function buildWeeklyDigestText({ report, context, source }: DigestInput): string {
  const insight = topInsight(report);
  const actions = openActionCount(report);
  const hub = process.env.APP_PUBLIC_URL?.trim() || PRODUCTION_TEAM_URL;
  const src =
    source === "pdf" ? "Metricool PDF imported" : source === "cron" ? "Weekly auto-sync" : "Metricool API sync";

  const lines = [
    `*finalREV PR · ${context.activityLabel}*`,
    `_${src}_`,
    "",
    `Video views: *${formatNumber(report.metricool_video_views)}* · Engagement: *${formatNumber(report.metricool_engagement)}*`,
    `Tooltrace visitors: *${formatNumber(report.posthog_visitors)}* · Pro subs: *${formatNumber(report.posthog_subscriptions)}*`,
    insight ? `\nTop insight: ${insight}` : "",
    actions > 0 ? `\n${actions} open action item${actions === 1 ? "" : "s"} in the hub.` : "",
    `\n<${hub}|Open PR Command Center>`,
  ].filter(Boolean);

  return lines.join("\n");
}

export async function postWeeklyDigest(input: DigestInput): Promise<boolean> {
  const webhook = process.env.SLACK_WEBHOOK_URL?.trim();
  if (!webhook) return false;

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: buildWeeklyDigestText(input).replace(/\*/g, "").replace(/_/g, ""),
        blocks: [
          {
            type: "section",
            text: { type: "mrkdwn", text: buildWeeklyDigestText(input) },
          },
        ],
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
