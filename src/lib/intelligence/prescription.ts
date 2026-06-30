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
  const noise = [...growth, ...posthog].filter((i) => i.type === "info").slice(0, 1);

  return {
    doFirst: queue[0]?.body ?? pnl.nextDollarMove,
    ignore:
      noise[0]?.body ??
      (linked
        ? "No post links logged. Add URLs to measure product traffic."
        : "Do not judge @gofinalrev Shorts by Tooltrace site traffic until Tooltrace clips ship."),
    betOfWeek: pulse.recommendation,
  };
}
