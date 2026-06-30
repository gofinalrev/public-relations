import type { PlaybookEntry, WeeklyIntelligence } from "./types";
import {
  buildIntelligenceInput,
  buildWeeklyIntelligence,
  parseIntelligenceJson,
} from "./build";
import {
  getAppSetting,
  setAppSetting,
  updateIntelligenceJson,
  type Channel,
  type WeeklyReport,
} from "@/lib/db";
import type { DashboardPeriodContext } from "@/lib/period-context";

const ORG_PLAYBOOK_KEY = "org_playbook_json";

export async function getOrgPlaybook(): Promise<PlaybookEntry[]> {
  const raw = await getAppSetting(ORG_PLAYBOOK_KEY);
  if (!raw?.trim()) return [];
  try {
    return JSON.parse(raw) as PlaybookEntry[];
  } catch {
    return [];
  }
}

export async function saveOrgPlaybook(entries: PlaybookEntry[]): Promise<void> {
  await setAppSetting(ORG_PLAYBOOK_KEY, JSON.stringify(entries));
}

export async function loadOrBuildIntelligence(params: {
  weekStart: string;
  report: WeeklyReport | null;
  previousReport: WeeklyReport | null;
  history: WeeklyReport[];
  channels: Channel[];
  context: DashboardPeriodContext;
  force?: boolean;
}): Promise<WeeklyIntelligence> {
  const storedPlaybook = await getOrgPlaybook();
  const input = buildIntelligenceInput(
    params.weekStart,
    params.report,
    params.previousReport,
    params.history,
    params.channels,
    params.context,
  );

  if (!params.force && params.report?.intelligence_json) {
    const cached = parseIntelligenceJson(params.report.intelligence_json);
    if (cached && params.report.updated_at) {
      const reportUpdated = new Date(params.report.updated_at).getTime();
      const intelGenerated = new Date(cached.generatedAt).getTime();
      if (intelGenerated >= reportUpdated - 2000) return cached;
    } else if (cached) {
      return cached;
    }
  }

  const intel = buildWeeklyIntelligence(input, storedPlaybook);
  await saveOrgPlaybook(intel.playbook);
  if (params.report) {
    await updateIntelligenceJson(params.weekStart, JSON.stringify(intel));
  }
  return intel;
}
