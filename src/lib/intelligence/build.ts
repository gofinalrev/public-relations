import { parsePostHighlights } from "@/lib/post-highlights";
import type { WeeklyIntelligence, IntelligenceInput, PlaybookEntry } from "./types";
import { buildContentPnl, buildFunnelStory } from "./content-pnl";
import { buildBoardNarrative } from "./board-narrative";
import { buildClipAttribution } from "./clip-attribution";
import { buildWarRoom } from "./war-room";
import { buildCompetitivePulse } from "./competitive-pulse";
import { buildMondayQueue } from "./monday-queue";
import { buildHookLibrary } from "./hook-library";
import { buildRepurposePlans } from "./repurpose";
import { buildPostAutopsies } from "./post-autopsy";
import { buildPublishPredictions } from "./publish-predict";
import { buildPrescription } from "./prescription";
import { buildPlaybookFromWeek, mergePlaybookEntries } from "./playbook";

/** Bump when intelligence logic changes — invalidates cached weekly JSON. */
export const INTELLIGENCE_VERSION = 2;

export function buildWeeklyIntelligence(
  input: IntelligenceInput,
  storedPlaybook: PlaybookEntry[] = [],
): WeeklyIntelligence {
  const posts = input.posts;
  const hookLibrary = buildHookLibrary(input.history, posts);
  const freshPlaybook = buildPlaybookFromWeek(input, hookLibrary);
  const playbook = mergePlaybookEntries(storedPlaybook, freshPlaybook);

  return {
    version: INTELLIGENCE_VERSION,
    contentPnl: buildContentPnl(input),
    funnelStory: buildFunnelStory(input),
    boardNarrative: buildBoardNarrative(input),
    prescription: buildPrescription(input),
    warRoom: buildWarRoom(input),
    competitivePulse: buildCompetitivePulse(input),
    mondayQueue: buildMondayQueue(input),
    hookLibrary,
    clipAttribution: buildClipAttribution(input),
    repurposePlans: buildRepurposePlans(input),
    autopsies: buildPostAutopsies(input),
    publishPredictions: buildPublishPredictions(posts, hookLibrary),
    playbook,
    generatedAt: new Date().toISOString(),
  };
}

export function buildIntelligenceInput(
  weekStart: string,
  report: IntelligenceInput["report"],
  previousReport: IntelligenceInput["previousReport"],
  history: IntelligenceInput["history"],
  channels: IntelligenceInput["channels"],
  context: IntelligenceInput["context"],
): IntelligenceInput {
  return {
    weekStart,
    report,
    previousReport,
    history,
    channels,
    context,
    posts: parsePostHighlights(report?.post_highlights_json),
  };
}

export function parseIntelligenceJson(raw: string | null | undefined): WeeklyIntelligence | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as WeeklyIntelligence;
    if ((parsed.version ?? 0) < INTELLIGENCE_VERSION) return null;
    if (parsed.funnelStory && !parsed.funnelStory.mode) {
      parsed.funnelStory.mode = "parallel";
    }
    return parsed;
  } catch {
    return null;
  }
}
