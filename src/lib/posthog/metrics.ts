import { addDays, endOfWeek, format, parseISO } from "date-fns";
import { fetchProSubscriptionCount } from "@/lib/stripe/subscriptions";
import { getStripeEnvironment, isStripeConfigured, stripeConfigSource } from "@/lib/stripe/config";
import {
  describeFunnelSources,
  funnelEventsSql,
  resolveCoherentFunnel,
  type ResolvedFunnel,
} from "./funnel-events";
import { POSTHOG_CONFIG } from "./config";
import { runHogQLQuery, scalarResult, rowsResult } from "./client";

export type PostHogFunnel = ResolvedFunnel;

export type PostHogReferrer = {
  domain: string;
  visitors: number;
};

export type PostHogWeeklyMetrics = {
  weekStart: string;
  weekEnd: string;
  /** When metrics span a custom range (e.g. monthly PDF), the actual query window */
  periodStart?: string;
  periodEnd?: string;
  uniqueVisitors: number;
  newSubscriptions: number;
  funnel: PostHogFunnel;
  topReferrers: PostHogReferrer[];
  subscriptionEventUsed: string;
  funnelEventSources?: string;
  funnelUsedInference?: boolean;
  /** PostHog project queried for funnel + traffic (Tooltrace = 167207) */
  posthogProjectId?: string;
  fetchedAt: string;
};

type QueryRange = {
  start: string;
  end: string;
  periodStart: string;
  periodEnd: string;
  label: string;
};

function buildQueryRange(periodStart: string, periodEnd: string, label: string): QueryRange {
  const endExclusive = addDays(parseISO(periodEnd), 1);
  return {
    start: `${periodStart} 00:00:00`,
    end: `${format(endExclusive, "yyyy-MM-dd")} 00:00:00`,
    periodStart,
    periodEnd,
    label,
  };
}

function weekRange(weekStart: string): QueryRange {
  const startDate = parseISO(weekStart);
  const endDate = endOfWeek(startDate, { weekStartsOn: 1 });
  return buildQueryRange(weekStart, format(endDate, "yyyy-MM-dd"), weekStart);
}

function tooltraceHostnameFilter(): string {
  const hosts = POSTHOG_CONFIG.tooltraceHostnames.map((h) => `'${h.trim()}'`).join(", ");
  return `(properties.$host IN (${hosts}) OR properties.$current_url LIKE '%tooltrace.ai%')`;
}

async function countDistinctUsersInRange(
  range: QueryRange,
  eventFilter: string,
  name: string,
): Promise<number> {
  const data = await runHogQLQuery(
    `
    SELECT count(DISTINCT distinct_id)
    FROM events
    WHERE timestamp >= toDateTime('${range.start}')
      AND timestamp < toDateTime('${range.end}')
      AND ${eventFilter}
    `,
    name,
  );
  return scalarResult(data);
}

async function countFunnelStageInRange(range: QueryRange, stage: "upload" | "generate" | "download"): Promise<number> {
  const data = await runHogQLQuery(
    `
    SELECT count()
    FROM events
    WHERE timestamp >= toDateTime('${range.start}')
      AND timestamp < toDateTime('${range.end}')
      AND ${funnelEventsSql(stage)}
    `,
    `funnel_${stage}_${range.label}`,
  );
  return scalarResult(data);
}

async function discoverSubscriptionEvent(range: QueryRange): Promise<string | null> {
  const candidates = await runHogQLQuery(
    `
    SELECT event, count() as c
    FROM events
    WHERE timestamp >= toDateTime('${range.start}')
      AND timestamp < toDateTime('${range.end}')
      AND (
        event ILIKE '%subscription%'
        OR event ILIKE '%checkout%'
        OR event ILIKE '%premium%'
        OR event ILIKE '%order_paid%'
      )
    GROUP BY event
    ORDER BY c DESC
    LIMIT 10
    `,
    `discover_subscription_events_${range.label}`,
  );

  const rows = rowsResult(candidates, (row) => ({
    event: String(row[0] ?? ""),
    count: Number(row[1] ?? 0),
  }));

  const paid = rows.find((r) => r.event === "order_paid");
  if (paid) return "order_paid";

  const subscription = rows.find((r) => r.event.toLowerCase().includes("subscription"));
  if (subscription) return subscription.event;

  const checkout = rows.find((r) => r.event === "checkout_started");
  if (checkout) return "checkout_started";

  return rows[0]?.event ?? null;
}

async function fetchPostHogMetricsForRange(
  range: QueryRange,
  weekKey: string,
): Promise<PostHogWeeklyMetrics> {
  const hostFilter = tooltraceHostnameFilter();
  const projectId = POSTHOG_CONFIG.tooltraceProjectId;

  const [
    uniqueVisitors,
    subscriptionSuccessViews,
    pageviews,
    uploadImage,
    generateOutline,
    downloadCad,
    referrers,
    discoveredEvent,
    stripeSubscriptions,
  ] = await Promise.all([
    countDistinctUsersInRange(
      range,
      `event = '$pageview' AND ${hostFilter}`,
      `unique_visitors_${range.label}`,
    ),
    countDistinctUsersInRange(
      range,
      `event = '$pageview' AND properties.$current_url LIKE '%subscription_success=true%'`,
      `subscription_success_${range.label}`,
    ),
    runHogQLQuery(
      `
      SELECT count()
      FROM events
      WHERE timestamp >= toDateTime('${range.start}')
        AND timestamp < toDateTime('${range.end}')
        AND event = '$pageview'
        AND ${hostFilter}
      `,
      `pageviews_${range.label}`,
    ).then((data) => scalarResult(data)),
    countFunnelStageInRange(range, "upload"),
    countFunnelStageInRange(range, "generate"),
    countFunnelStageInRange(range, "download"),
    runHogQLQuery(
      `
      SELECT
        coalesce(nullIf(properties.$referring_domain, ''), '$direct') as domain,
        count(DISTINCT distinct_id) as visitors
      FROM events
      WHERE timestamp >= toDateTime('${range.start}')
        AND timestamp < toDateTime('${range.end}')
        AND event = '$pageview'
        AND ${hostFilter}
      GROUP BY domain
      ORDER BY visitors DESC
      LIMIT 8
      `,
      `top_referrers_${range.label}`,
    ).then((data) =>
      rowsResult(data, (row) => ({
        domain: String(row[0] ?? "direct"),
        visitors: Number(row[1] ?? 0),
      })),
    ),
    discoverSubscriptionEvent(range),
    fetchProSubscriptionCount(range.periodStart, range.periodEnd),
  ]);

  let newSubscriptions = subscriptionSuccessViews;
  let subscriptionEventUsed = isStripeConfigured()
    ? "PostHog fallback (Stripe configured)"
    : stripeConfigSource() === "missing"
      ? "Stripe not configured — add STRIPE_SECRET_KEY + STRIPE_PRO_PRICE_ID to .env.local"
      : "PostHog subscription_success pageview";

  if (stripeSubscriptions.source === "stripe") {
    newSubscriptions = stripeSubscriptions.count;
    subscriptionEventUsed = `Stripe Pro subscriptions (${getStripeEnvironment()})`;
  } else if (discoveredEvent && discoveredEvent !== "order_paid") {
    const discoveredCount = await countDistinctUsersInRange(
      range,
      `event = '${discoveredEvent}'`,
      `subs_${discoveredEvent}_${range.label}`,
    );
    if (discoveredCount > newSubscriptions) {
      newSubscriptions = discoveredCount;
      subscriptionEventUsed = discoveredEvent;
    }
  }

  const isCustomPeriod = range.periodStart !== weekKey || range.periodEnd !== weekRange(weekKey).periodEnd;

  const funnel = resolveCoherentFunnel({
    pageviews,
    upload: uploadImage,
    generate: generateOutline,
    download: downloadCad,
    subscription_success: subscriptionSuccessViews,
  });

  return {
    weekStart: weekKey,
    weekEnd: isCustomPeriod ? range.periodEnd : weekRange(weekKey).periodEnd,
    periodStart: isCustomPeriod ? range.periodStart : undefined,
    periodEnd: isCustomPeriod ? range.periodEnd : undefined,
    uniqueVisitors,
    newSubscriptions,
    funnel,
    topReferrers: referrers,
    subscriptionEventUsed,
    funnelEventSources: describeFunnelSources(funnel.stages),
    funnelUsedInference: funnel.usedInference,
    posthogProjectId: projectId,
    fetchedAt: new Date().toISOString(),
  };
}

export async function fetchWeeklyPostHogMetrics(weekStart: string): Promise<PostHogWeeklyMetrics> {
  return fetchPostHogMetricsForRange(weekRange(weekStart), weekStart);
}

export async function fetchPostHogMetricsForPeriod(
  periodStart: string,
  periodEnd: string,
  weekKey: string,
): Promise<PostHogWeeklyMetrics> {
  return fetchPostHogMetricsForRange(
    buildQueryRange(periodStart, periodEnd, `${periodStart}_${periodEnd}`),
    weekKey,
  );
}

export async function fetchRecentWeeksFromPostHog(weekStarts: string[]): Promise<PostHogWeeklyMetrics[]> {
  const results: PostHogWeeklyMetrics[] = [];
  for (const week of weekStarts) {
    results.push(await fetchWeeklyPostHogMetrics(week));
  }
  return results;
}
