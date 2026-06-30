import type { Channel, WeeklyReport } from "@/lib/db";
import type { DashboardPeriodContext } from "@/lib/period-context";

/** Cumulative follower/sub milestones vs counts for the selected reporting period */
export type ChannelGoalScope = "milestone" | "period";

export type ResolvedChannelGoal = {
  slug: string;
  scope: ChannelGoalScope;
  /** Value shown in progress bar */
  displayValue: number;
  /** Denominator for progress (scaled for multi-week period goals) */
  displayTarget: number;
  progressPct: number;
  /** active | achieved — achieved only for milestone goals met, or period goal hit this view */
  displayStatus: Channel["status"];
  scopeHint: string;
  valueCaption: string;
  targetCaption: string;
  syncSource: string | null;
  hasPeriodData: boolean;
};

const PERIOD_SLUGS = new Set(["tooltrace-web", "finalrev-web"]);

export function isPeriodGoalChannel(slug: string): boolean {
  return PERIOD_SLUGS.has(slug);
}

export function isMilestoneGoalChannel(slug: string): boolean {
  return !PERIOD_SLUGS.has(slug);
}

function parseFunnelExtras(report: WeeklyReport | null): {
  finalrevCadUploads?: number;
  subscriptionEventUsed?: string;
} {
  if (!report?.posthog_funnel_json) return {};
  try {
    return JSON.parse(report.posthog_funnel_json) as {
      finalrevCadUploads?: number;
      subscriptionEventUsed?: string;
    };
  } catch {
    return {};
  }
}

function periodValueForChannel(slug: string, report: WeeklyReport | null): number | null {
  if (!report) return null;
  if (slug === "tooltrace-web") {
    if (!report.posthog_synced_at) return null;
    return report.posthog_subscriptions;
  }
  if (slug === "finalrev-web") {
    if (!report.posthog_synced_at) return null;
    const extras = parseFunnelExtras(report);
    return extras.finalrevCadUploads ?? 0;
  }
  return null;
}

/** Weekly goal target scaled for multi-week Metricool/PostHog windows */
export function scaledPeriodTarget(weeklyTarget: number, periodDays: number): number {
  if (periodDays <= 7) return weeklyTarget;
  return Math.max(weeklyTarget, Math.round(weeklyTarget * (periodDays / 7)));
}

function buildScopeHint(context: DashboardPeriodContext | null, scope: ChannelGoalScope): string {
  if (scope === "milestone") {
    return "All-time · manual, PDF, or API";
  }
  if (!context) return "Selected reporting period";
  if (context.isMultiWeekReport) {
    return `${context.activityLabel} · period total`;
  }
  return `${context.activityLabel} · this week`;
}

function buildValueCaption(scope: ChannelGoalScope, context: DashboardPeriodContext | null): string {
  if (scope === "milestone") return "current total";
  if (context?.isMultiWeekReport) return "this period";
  return "this week";
}

function buildTargetCaption(
  channel: Channel,
  scope: ChannelGoalScope,
  context: DashboardPeriodContext | null,
  displayTarget: number,
): string {
  if (scope === "milestone") {
    return `milestone: ${channel.goal_target.toLocaleString()}`;
  }
  if (context && context.periodDays > 7) {
    return `goal: ${displayTarget.toLocaleString()} (${channel.goal_target}/wk × ${(context.periodDays / 7).toFixed(1)} wks)`;
  }
  return `goal: ${channel.goal_target.toLocaleString()} / week`;
}

export function resolveChannelGoal(
  channel: Channel,
  report: WeeklyReport | null,
  context: DashboardPeriodContext | null,
): ResolvedChannelGoal {
  const scope: ChannelGoalScope = isPeriodGoalChannel(channel.slug) ? "period" : "milestone";
  const periodDays = context?.periodDays ?? 7;

  if (scope === "milestone") {
    const displayValue = channel.current_value;
    const displayTarget = channel.goal_target;
    const progressPct =
      displayTarget > 0 ? Math.min(100, (displayValue / displayTarget) * 100) : 0;
    const displayStatus: Channel["status"] =
      displayValue >= displayTarget ? "achieved" : channel.status === "planned" ? "planned" : channel.status === "setup_needed" ? "setup_needed" : "active";

    let syncSource: string | null = null;
    if (channel.slug === "youtube") syncSource = "YouTube API or Metricool PDF";
    else if (channel.slug === "reddit") syncSource = "Reddit API";
    else syncSource = "Manual or PDF";

    return {
      slug: channel.slug,
      scope,
      displayValue,
      displayTarget,
      progressPct,
      displayStatus,
      scopeHint: buildScopeHint(context, scope),
      valueCaption: buildValueCaption(scope, context),
      targetCaption: buildTargetCaption(channel, scope, context, displayTarget),
      syncSource,
      hasPeriodData: true,
    };
  }

  const periodVal = periodValueForChannel(channel.slug, report);
  const hasPeriodData = periodVal !== null;
  const displayValue = periodVal ?? 0;
  const displayTarget = scaledPeriodTarget(channel.goal_target, periodDays);
  const progressPct =
    displayTarget > 0 ? Math.min(100, (displayValue / displayTarget) * 100) : 0;
  const displayStatus: Channel["status"] =
    hasPeriodData && displayValue >= displayTarget ? "achieved" : "active";

  const extras = parseFunnelExtras(report);
  let syncSource: string | null = null;
  if (channel.slug === "tooltrace-web") {
    syncSource = extras.subscriptionEventUsed ?? "Stripe / PostHog";
  } else if (channel.slug === "finalrev-web") {
    syncSource = "PostHog cad_upload (209711)";
  }

  return {
    slug: channel.slug,
    scope,
    displayValue,
    displayTarget,
    progressPct,
    displayStatus,
    scopeHint: buildScopeHint(context, scope),
    valueCaption: buildValueCaption(scope, context),
    targetCaption: buildTargetCaption(channel, scope, context, displayTarget),
    syncSource,
    hasPeriodData,
  };
}

export function resolveAllChannelGoals(
  channels: Channel[],
  report: WeeklyReport | null,
  context: DashboardPeriodContext | null,
): Map<string, ResolvedChannelGoal> {
  return new Map(channels.map((ch) => [ch.slug, resolveChannelGoal(ch, report, context)]));
}

/** Status to persist when user manually updates a milestone channel */
export function milestoneStatusAfterSave(
  currentValue: number,
  goalTarget: number,
  previous: Channel["status"],
): Channel["status"] {
  if (currentValue >= goalTarget) return "achieved";
  if (previous === "planned" || previous === "setup_needed") return previous;
  return "active";
}
