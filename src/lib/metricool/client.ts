import { METRICOOL_CONFIG } from "./config";

export class MetricoolApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "MetricoolApiError";
  }
}

type QueryParams = Record<string, string | number | undefined>;

export async function metricoolFetch<T>(
  path: string,
  params: QueryParams = {},
): Promise<T> {
  const { baseUrl, userToken, userId, blogId } = METRICOOL_CONFIG;

  if (!userToken || !userId || !blogId) {
    throw new MetricoolApiError(
      "Metricool not configured. Add METRICOOL_USER_TOKEN, METRICOOL_USER_ID, and METRICOOL_BLOG_ID to .env.local (Account Settings → API). Requires Advanced plan.",
    );
  }

  const url = new URL(`${baseUrl}${path.startsWith("/") ? path : `/${path}`}`);
  url.searchParams.set("userId", userId);
  url.searchParams.set("blogId", blogId);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const response = await fetch(url.toString(), {
    headers: { "X-Mc-Auth": userToken, Accept: "application/json" },
    cache: "no-store",
  });

  const text = await response.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const detail =
      typeof data === "object" && data && "message" in data
        ? String((data as { message: string }).message)
        : typeof data === "object" && data && "detail" in data
          ? String((data as { detail: string }).detail)
          : text.slice(0, 200);
    throw new MetricoolApiError(
      detail || `Metricool API error (${response.status})`,
      response.status,
    );
  }

  return data as T;
}

/** Timeline returns [[date, value], ...] as string pairs */
export function sumTimelineValues(data: unknown): number {
  if (!Array.isArray(data)) return 0;
  return data.reduce((sum, row) => {
    if (!Array.isArray(row) || row.length < 2) return sum;
    const val = Number(row[1]);
    return sum + (Number.isFinite(val) ? val : 0);
  }, 0);
}

export function lastTimelineValue(data: unknown): number {
  if (!Array.isArray(data) || data.length === 0) return 0;
  const last = data[data.length - 1];
  if (!Array.isArray(last) || last.length < 2) return 0;
  return Number(last[1]) || 0;
}

export function sumV2Timeline(data: unknown): number {
  // v2 may return { data: [[ts, val], ...] } or array directly
  if (typeof data === "object" && data && "data" in data) {
    return sumTimelineValues((data as { data: unknown }).data);
  }
  if (Array.isArray(data)) {
    // Could be [{value: n}, ...] or [[date, val]]
    if (data.length > 0 && typeof data[0] === "object" && data[0] && "value" in (data[0] as object)) {
      return (data as { value: number }[]).reduce((s, p) => s + (Number(p.value) || 0), 0);
    }
    return sumTimelineValues(data);
  }
  return 0;
}

export function lastV2Timeline(data: unknown): number {
  if (typeof data === "object" && data && "data" in data) {
    return lastTimelineValue((data as { data: unknown }).data);
  }
  if (Array.isArray(data) && data.length > 0) {
    if (typeof data[0] === "object" && data[0] && "value" in (data[0] as object)) {
      return Number((data[data.length - 1] as { value: number }).value) || 0;
    }
    return lastTimelineValue(data);
  }
  return 0;
}

export async function fetchTimelineMetric(
  metric: string,
  start: string,
  end: string,
): Promise<number> {
  const data = await metricoolFetch<unknown>(`/stats/timeline/${metric}`, { start, end });
  return sumTimelineValues(data);
}

export async function fetchTimelineLatest(metric: string, start: string, end: string): Promise<number> {
  const data = await metricoolFetch<unknown>(`/stats/timeline/${metric}`, { start, end });
  return lastTimelineValue(data);
}

export async function fetchV2Timeline(params: {
  network: string;
  metric: string;
  from: string;
  to: string;
  subject?: string;
  scope?: string;
}): Promise<number> {
  const data = await metricoolFetch<unknown>("/v2/analytics/timelines", {
    network: params.network,
    metric: params.metric,
    from: params.from,
    to: params.to,
    timezone: METRICOOL_CONFIG.timezone,
    ...(params.subject ? { subject: params.subject } : {}),
    ...(params.scope ? { scope: params.scope } : {}),
  });
  return sumV2Timeline(data);
}

export async function fetchV2TimelineLatest(params: {
  network: string;
  metric: string;
  from: string;
  to: string;
  subject?: string;
}): Promise<number> {
  const data = await metricoolFetch<unknown>("/v2/analytics/timelines", {
    network: params.network,
    metric: params.metric,
    from: params.from,
    to: params.to,
    timezone: METRICOOL_CONFIG.timezone,
    ...(params.subject ? { subject: params.subject } : {}),
  });
  return lastV2Timeline(data);
}

export async function fetchProfiles(): Promise<unknown> {
  return metricoolFetch("/admin/simpleProfiles", {});
}
