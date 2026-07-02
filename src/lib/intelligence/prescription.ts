import type { IntelligenceInput, ExecutivePrescription } from "./types";
import { buildContentPnl } from "./content-pnl";
import { buildMondayQueue } from "./monday-queue";
import { buildCompetitivePulse } from "./competitive-pulse";
import { canAttributeSocialToTooltrace, resolveContentFocus } from "./content-focus";
import { filterExecutiveInsights } from "@/lib/ops-log";
import { parseStoredInsights } from "@/lib/action-items";

export function buildPrescription(input: IntelligenceInput): ExecutivePrescription {
  const queue = buildMondayQueue(input);
  const pulse = buildCompetitivePulse(input);
  const pnl = buildContentPnl(input);
  const { report, posts } = input;
  const linked = canAttributeSocialToTooltrace(resolveContentFocus(posts));

  const growth = filterExecutiveInsights(parseStoredInsights(report?.growth_insights ?? ""));
  const posthog = filterExecutiveInsights(parseStoredInsights(report?.posthog_insights ?? ""));
  const insight = [...growth, ...posthog].find((i) => i.type === "warning" || i.type === "info");

  let ignore = linked
    ? "Don't tie Tooltrace traffic to posts until clips are tagged Tooltrace."
    : "Don't compare @gofinalrev views to Tooltrace visitors — different products.";

  if (posts.length === 0 && (report?.metricool_video_views ?? 0) > 0) {
    ignore = "Aggregate Metricool views without post breakdown — add individual posts before drawing clip-level conclusions.";
  } else if (insight?.body) {
    ignore = insight.body;
  }

  return {
    doFirst: queue[0]?.body ?? pnl.nextStep,
    ignore,
    betOfWeek: pulse.recommendation,
  };
}
