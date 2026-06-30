import { addDays, endOfWeek, format, parseISO } from "date-fns";
import { POSTHOG_CONFIG } from "./config";
import { runHogQLQuery, scalarResult } from "./client";

type QueryRange = {
  start: string;
  end: string;
  label: string;
};

function weekRange(weekStart: string): QueryRange {
  const startDate = parseISO(weekStart);
  const endDate = endOfWeek(startDate, { weekStartsOn: 1 });
  return {
    start: `${weekStart} 00:00:00`,
    end: `${format(addDays(endDate, 1), "yyyy-MM-dd")} 00:00:00`,
    label: weekStart,
  };
}

function buildQueryRange(periodStart: string, periodEnd: string, label: string): QueryRange {
  const endExclusive = addDays(parseISO(periodEnd), 1);
  return {
    start: `${periodStart} 00:00:00`,
    end: `${format(endExclusive, "yyyy-MM-dd")} 00:00:00`,
    label,
  };
}

function finalrevHostnameFilter(): string {
  const hosts = POSTHOG_CONFIG.finalrevHostnames.map((h) => `'${h.trim()}'`).join(", ");
  return `(properties.$host IN (${hosts}) OR properties.$current_url LIKE '%finalrev.com%')`;
}

async function countFinalRevEventsInRange(range: QueryRange, eventFilter: string, name: string): Promise<number> {
  const data = await runHogQLQuery(
    `
    SELECT count()
    FROM events
    WHERE timestamp >= toDateTime('${range.start}')
      AND timestamp < toDateTime('${range.end}')
      AND ${eventFilter}
    `,
    name,
    POSTHOG_CONFIG.finalrevProjectId,
  );
  return scalarResult(data);
}

/** STEP / CAD uploads on finalrev.com — PostHog project 209711 */
export async function fetchFinalRevCadUploadsForWeek(weekStart: string): Promise<number> {
  return fetchFinalRevCadUploadsForRange(weekRange(weekStart));
}

export async function fetchFinalRevCadUploadsForPeriod(
  periodStart: string,
  periodEnd: string,
  label: string,
): Promise<number> {
  return fetchFinalRevCadUploadsForRange(buildQueryRange(periodStart, periodEnd, label));
}

async function fetchFinalRevCadUploadsForRange(range: QueryRange): Promise<number> {
  const hostFilter = finalrevHostnameFilter();
  return countFinalRevEventsInRange(
    range,
    `event = 'cad_upload' AND ${hostFilter}`,
    `finalrev_cad_upload_${range.label}`,
  );
}
