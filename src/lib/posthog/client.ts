import { POSTHOG_CONFIG } from "./config";

export type HogQLQueryResponse = {
  results?: unknown[][];
  columns?: string[];
  error?: string;
  detail?: string;
};

export class PostHogApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "PostHogApiError";
  }
}

export async function runHogQLQuery(
  query: string,
  name: string,
  projectId: string = POSTHOG_CONFIG.tooltraceProjectId,
): Promise<HogQLQueryResponse> {
  const { host, personalApiKey } = POSTHOG_CONFIG;

  if (!personalApiKey) {
    throw new PostHogApiError(
      "PostHog personal API key missing. Add POSTHOG_PERSONAL_API_KEY to .env.local (Query Read scope).",
    );
  }

  const response = await fetch(`${host}/api/projects/${projectId}/query/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${personalApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: { kind: "HogQLQuery", query },
      name,
    }),
    cache: "no-store",
  });

  const data = (await response.json()) as HogQLQueryResponse & { detail?: string };

  if (!response.ok) {
    throw new PostHogApiError(data.detail ?? data.error ?? `PostHog API error (${response.status})`, response.status);
  }

  return data;
}

export function scalarResult(data: HogQLQueryResponse): number {
  const value = data.results?.[0]?.[0];
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  return 0;
}

export function rowsResult<T extends Record<string, unknown>>(
  data: HogQLQueryResponse,
  mapper: (row: unknown[], columns: string[]) => T,
): T[] {
  const columns = data.columns ?? [];
  return (data.results ?? []).map((row) => mapper(row, columns));
}
