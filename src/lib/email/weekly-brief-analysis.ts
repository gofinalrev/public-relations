import type { Channel, WeeklyReport } from "@/lib/db";
import type { DashboardPeriodContext } from "@/lib/period-context";
import type { HistoryAnalytics } from "@/lib/history-analytics";
import { analyzeHistory, formatMomentum } from "@/lib/history-analytics";
import { parseStoredInsights } from "@/lib/action-items";
import { buildPrContentIdeas } from "@/lib/pr-toolkit/content-ideas";
import {
  analyzePostHighlights,
  parsePostHighlights,
  platformLabel,
  totalHighlightViews,
} from "@/lib/post-highlights";
import type { MetricoolWeeklyMetrics } from "@/lib/metricool/metrics";
import { resolveChannelGoal } from "@/lib/channel-goals";
import { formatNumber } from "@/lib/utils";
import { isStripeSubsUnconfigured, logOps } from "@/lib/ops-log";
import { PRODUCTION_TEAM_URL } from "@/lib/team-url";
import { buildIntelligenceInput, buildWeeklyIntelligence } from "@/lib/intelligence/build";

export type BriefMetric = {
  label: string;
  value: string;
  note?: string;
  layer: "social" | "tooltrace" | "finalrev";
};

export type BriefSection = {
  title: string;
  body: string[];
  bullets?: string[];
};

export type WeeklyBriefAnalysis = {
  subject: string;
  periodLabel: string;
  executiveSummary: string;
  metrics: BriefMetric[];
  sections: BriefSection[];
  priorities: string[];
  hubUrl: string;
  plainText: string;
  html: string;
};

type BuildInput = {
  weekStart: string;
  report: WeeklyReport | null;
  previousReport: WeeklyReport | null;
  history: WeeklyReport[];
  channels: Channel[];
  context: DashboardPeriodContext;
};

function parseBreakdown(report: WeeklyReport | null): MetricoolWeeklyMetrics | null {
  if (!report?.metricool_breakdown_json) return null;
  try {
    return JSON.parse(report.metricool_breakdown_json) as MetricoolWeeklyMetrics;
  } catch {
    return null;
  }
}

function parseFunnel(report: WeeklyReport | null) {
  if (!report?.posthog_funnel_json) return null;
  try {
    return JSON.parse(report.posthog_funnel_json) as {
      analysis?: { conversionRate?: number | null; activationRate?: number | null };
      topReferrers?: { domain: string; visitors: number }[];
      finalrevCadUploads?: number;
      funnel?: { upload_image?: number; download_cad?: number; pageviews?: number };
      subscriptionEventUsed?: string;
    };
  } catch {
    return null;
  }
}

function pctDelta(current: number, previous: number | null): string | undefined {
  if (previous === null || previous === 0) return undefined;
  const pct = ((current - previous) / previous) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(0)}% vs prior period`;
}

function likeRate(views: number, likes: number): string {
  if (views <= 0) return "—";
  return `${((likes / views) * 100).toFixed(1)}%`;
}

function sectionWhatsWorking(
  report: WeeklyReport,
  posts: ReturnType<typeof parsePostHighlights>,
): BriefSection {
  const bullets: string[] = [];
  const growth = parseStoredInsights(report.growth_insights ?? "");
  const posthog = parseStoredInsights(report.posthog_insights ?? "");
  const wins = [...growth, ...posthog].filter((i) => i.type === "success");

  for (const w of wins.slice(0, 4)) {
    bullets.push(`${w.title}: ${w.body}`);
  }

  for (const insight of analyzePostHighlights(posts).filter((i) => i.type === "success")) {
    bullets.push(`${insight.title}: ${insight.body}`);
  }

  const breakdown = parseBreakdown(report);
  const yt = breakdown?.platforms.find((p) => p.platform === "youtube");
  if (yt && yt.videoViews > 0) {
    bullets.push(
      `YouTube Shorts: ${formatNumber(yt.videoViews)} views. ${formatNumber(yt.followers)}/1,000 subscribers (YPP).`,
    );
  }

  const funnel = parseFunnel(report);
  if (funnel?.analysis?.activationRate != null && funnel.analysis.activationRate >= 50) {
    bullets.push(
      `Tooltrace activation: ${funnel.analysis.activationRate.toFixed(0)}% of visitors reach upload/trace.`,
    );
  }

  const li = breakdown?.platforms.find((p) => p.platform === "linkedin");
  if (li && li.impressions > 100) {
    bullets.push(
      `LinkedIn: ${formatNumber(li.impressions)} impressions, ${formatNumber(li.engagement || 0)} interactions.`,
    );
  }

  if (bullets.length === 0) {
    bullets.push("Baseline week. Continue posting Shorts and logging post stats for comparables.");
  }

  return {
    title: "What's working",
    body: ["Patterns worth repeating this week:"],
    bullets,
  };
}

function sectionWhatsNotWorking(report: WeeklyReport, posts: ReturnType<typeof parsePostHighlights>): BriefSection {
  const bullets: string[] = [];
  const growth = parseStoredInsights(report.growth_insights ?? "");
  const posthog = parseStoredInsights(report.posthog_insights ?? "");
  const issues = [...growth, ...posthog].filter((i) => i.type === "critical" || i.type === "warning");

  for (const issue of issues.slice(0, 5)) {
    bullets.push(`${issue.title}: ${issue.body}`);
  }

  for (const insight of analyzePostHighlights(posts).filter((i) => i.type === "warning")) {
    bullets.push(`${insight.title}: ${insight.body}`);
  }

  const groups = new Map<string, typeof posts>();
  for (const p of posts) {
    if (!p.groupId) continue;
    const list = groups.get(p.groupId) ?? [];
    list.push(p);
    groups.set(p.groupId, list);
  }
  for (const [, group] of groups) {
    if (group.length < 2) continue;
    const sorted = [...group].sort((a, b) => b.views - a.views);
    const best = sorted[0];
    const rest = sorted.slice(1);
    if (best.views > rest.reduce((s, p) => s + p.views, 0) * 2 && best.views >= 100) {
      bullets.push(
        `Cross-post gap: "${best.title}" at ${formatNumber(best.views)} on ${platformLabel(best.platform)} vs ${rest.map((p) => `${formatNumber(p.views)} on ${platformLabel(p.platform)}`).join(", ")}. Use native hooks per platform.`,
      );
    }
  }

  const breakdown = parseBreakdown(report);
  const inactive = breakdown?.platforms.filter(
    (p) => p.videoViews === 0 && p.engagement === 0 && p.impressions === 0 && p.followers > 0,
  );
  if (inactive?.length) {
    bullets.push(
      `Quiet channels with audience but no period activity: ${inactive.map((p) => p.name).join(", ")}.`,
    );
  }

  if (bullets.length === 0) {
    bullets.push("No major issues in automated checks. Validate Pro sub counts against Stripe before external sharing.");
  }

  return {
    title: "What's not working",
    body: ["Friction points and gaps to address:"],
    bullets,
  };
}

function sectionOpportunities(
  input: BuildInput,
  analytics: HistoryAnalytics,
): BriefSection {
  const bullets: string[] = [];
  const ideas = buildPrContentIdeas(input.report, input.channels, input.context);

  for (const idea of ideas.filter((i) => i.priority === "high").slice(0, 4)) {
    bullets.push(`${idea.title}: ${idea.body}`);
  }

  const funnel = parseFunnel(input.report);
  const referrers = funnel?.topReferrers ?? [];
  const google = referrers.find((r) => r.domain.includes("google"));
  const gridfinity = referrers.find((r) => r.domain.includes("gridfinity"));
  const youtubeRef = referrers.find((r) => r.domain.includes("youtube"));

  if (google && google.visitors >= 1000) {
    bullets.push(
      `SEO: ${formatNumber(google.visitors)} visitors from Google. Consider Gridfinity and 5S content on tooltrace.ai.`,
    );
  }
  if (gridfinity && gridfinity.visitors >= 100) {
    bullets.push(
      `Maker community: ${formatNumber(gridfinity.visitors)} visitors from gridfinity.xyz. Publish community designs and 5S content for Gridfinity users.`,
    );
  }
  if (youtubeRef && youtubeRef.visitors >= 50) {
    bullets.push(
      `YouTube referrer: ${formatNumber(youtubeRef.visitors)} Tooltrace visitors tagged from YouTube. Log which Short drove clicks when Tooltrace clips go live.`,
    );
  }

  const socialChannels = input.channels.filter((c) => c.platform !== "web");
  const furthest = [...socialChannels]
    .map((ch) => ({ ch, resolved: resolveChannelGoal(ch, input.report, input.context) }))
    .sort((a, b) => a.resolved.progressPct - b.resolved.progressPct)[0];
  if (furthest && furthest.resolved.progressPct < 30) {
    bullets.push(
      `Channel goal: ${furthest.ch.name} at ${formatNumber(furthest.resolved.displayValue)} / ${formatNumber(furthest.resolved.displayTarget)} (${furthest.ch.goal_label}). Add follower CTAs on every post.`,
    );
  }

  if (analytics.momentum.viewsVs4WeekAvg != null && analytics.momentum.viewsVs4WeekAvg > 20) {
    bullets.push(`Social views ${formatMomentum(analytics.momentum.viewsVs4WeekAvg)} vs 4-week average.`);
  }

  const tiktok = input.channels.find((c) => c.slug === "tiktok");
  if (tiktok && tiktok.current_value === 0) {
    bullets.push("TikTok not started. Repurpose top YouTube Short with native caption.");
  }

  if (bullets.length === 0) {
    bullets.push("Publish 2–3 shop-floor Shorts per week; native-edit top performer for Instagram; one LinkedIn DFM insight per Short for finalREV quotes.");
  }

  return {
    title: "Where to grow",
    body: ["Top actions based on this period's data:"],
    bullets,
  };
}

function sectionPostPerformance(posts: ReturnType<typeof parsePostHighlights>): BriefSection | null {
  if (posts.length === 0) return null;

  const sorted = [...posts].sort((a, b) => b.views - a.views);
  const bullets = sorted.map((p) => {
    const fmt = p.format ? ` · ${p.format}` : "";
    const likes = p.likes > 0 ? ` · ${p.likes} likes (${likeRate(p.views, p.likes)})` : "";
    const date = p.publishedAt ? ` · ${p.publishedAt}` : "";
    return `"${p.title}": ${formatNumber(p.views)} views on ${platformLabel(p.platform)}${fmt}${likes}${date}`;
  });

  return {
    title: "Post performance (logged)",
    body: [
      `${posts.length} posts tracked · ${formatNumber(totalHighlightViews(posts))} total logged views. Metricool may undercount IG Reel views; manual logs are the source of truth for cross-platform comparison.`,
    ],
    bullets,
  };
}

function sectionReferrers(report: WeeklyReport): BriefSection | null {
  const funnel = parseFunnel(report);
  const referrers = funnel?.topReferrers?.filter((r) => r.visitors > 0).slice(0, 8);
  if (!referrers?.length) return null;

  const total = referrers.reduce((s, r) => s + r.visitors, 0);
  const bullets = referrers.map((r) => {
    const pct = total > 0 ? ((r.visitors / total) * 100).toFixed(0) : "0";
    const label = r.domain === "$direct" ? "Direct / bookmark" : r.domain;
    return `${label}: ${formatNumber(r.visitors)} visitors (${pct}% of top sources)`;
  });

  return {
    title: "Tooltrace traffic sources",
    body: ["Where tooltrace.ai visitors came from this period:"],
    bullets,
  };
}

function buildMetrics(input: BuildInput): BriefMetric[] {
  const { report, previousReport, context } = input;
  if (!report) return [];

  const funnel = parseFunnel(report);
  const prevViews = previousReport?.metricool_video_views ?? null;
  const prevVisitors = previousReport?.posthog_visitors ?? null;
  const prevSubs = previousReport?.posthog_subscriptions ?? null;

  const metrics: BriefMetric[] = [
    {
      layer: "social",
      label: "Video views",
      value: formatNumber(report.metricool_video_views),
      note: pctDelta(report.metricool_video_views, prevViews),
    },
    {
      layer: "social",
      label: "Social reach",
      value: formatNumber(report.metricool_engagement),
      note: "Impressions + LinkedIn clicks (Metricool)",
    },
    {
      layer: "tooltrace",
      label: "Tooltrace visitors",
      value: formatNumber(report.posthog_visitors),
      note: pctDelta(report.posthog_visitors, prevVisitors),
    },
    {
      layer: "tooltrace",
      label: "Pro subscriptions",
      value: formatNumber(report.posthog_subscriptions),
      note: pctDelta(report.posthog_subscriptions, prevSubs),
    },
  ];

  if (funnel?.analysis?.conversionRate != null) {
    metrics.push({
      layer: "tooltrace",
      label: "Visitor → Pro conversion",
      value: `${funnel.analysis.conversionRate.toFixed(1)}%`,
    });
  }
  if (funnel?.analysis?.activationRate != null) {
    metrics.push({
      layer: "tooltrace",
      label: "Activation (upload/trace)",
      value: `${funnel.analysis.activationRate.toFixed(0)}%`,
    });
  }
  if (funnel?.finalrevCadUploads != null) {
    metrics.push({
      layer: "finalrev",
      label: "STEP uploads",
      value: formatNumber(funnel.finalrevCadUploads),
      note: "finalrev.com quote intent",
    });
  }

  const yt = input.channels.find((c) => c.slug === "youtube");
  if (yt) {
    metrics.push({
      layer: "social",
      label: "YouTube subs (live)",
      value: `${formatNumber(yt.current_value)} / ${formatNumber(yt.goal_target)}`,
      note: "YPP milestone",
    });
  }

  if (context.isMultiWeekReport) {
    metrics.forEach((m) => {
      if (m.note?.includes("prior period") && context.periodDays > 7) {
        m.note = `${m.note} · note: ${context.periodDays}-day window may not match prior week`;
      }
    });
  }

  return metrics;
}

function buildPriorities(input: BuildInput): string[] {
  const intel = buildWeeklyIntelligence(
    buildIntelligenceInput(
      input.weekStart,
      input.report,
      input.previousReport,
      input.history,
      input.channels,
      input.context,
    ),
  );
  const priorities = [
    `Priority: ${intel.prescription.doFirst}`,
    `Weekly focus: ${intel.prescription.betOfWeek}`,
  ];

  for (const item of intel.mondayQueue.slice(1, 4)) {
    priorities.push(item.title);
  }

  return priorities.slice(0, 5);
}

function renderPlainText(analysis: Omit<WeeklyBriefAnalysis, "plainText" | "html">): string {
  const lines: string[] = [
    "finalREV · PR Weekly Brief",
    analysis.periodLabel,
    "",
    "EXECUTIVE SUMMARY",
    analysis.executiveSummary,
    "",
    "KEY METRICS",
    ...analysis.metrics.map((m) => {
      const layer = m.layer === "social" ? "Social" : m.layer === "tooltrace" ? "Tooltrace" : "finalREV";
      return `• [${layer}] ${m.label}: ${m.value}${m.note ? ` (${m.note})` : ""}`;
    }),
    "",
  ];

  for (const section of analysis.sections) {
    lines.push(section.title.toUpperCase());
    lines.push(...section.body);
    if (section.bullets) {
      for (const b of section.bullets) lines.push(`  • ${b}`);
    }
    lines.push("");
  }

  lines.push("THIS WEEK'S PRIORITIES");
  for (const p of analysis.priorities) lines.push(`  • ${p}`);
  lines.push("");
  lines.push(`Open PR Command Center: ${analysis.hubUrl}`);

  return lines.join("\n");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderHtml(analysis: Omit<WeeklyBriefAnalysis, "plainText" | "html">): string {
  const metricRows = analysis.metrics
    .map((m) => {
      const layerColor =
        m.layer === "social" ? "#6366f1" : m.layer === "tooltrace" ? "#059669" : "#d97706";
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;">
          <span style="color:${layerColor};font-weight:600;text-transform:uppercase;font-size:10px;">${escapeHtml(m.layer)}</span><br/>
          <strong>${escapeHtml(m.label)}</strong>
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:15px;font-weight:700;text-align:right;">${escapeHtml(m.value)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:11px;color:#666;">${escapeHtml(m.note ?? "")}</td>
      </tr>`;
    })
    .join("");

  const sectionHtml = analysis.sections
    .map((s) => {
      const bullets = s.bullets
        ? `<ul style="margin:8px 0 0;padding-left:20px;color:#374151;font-size:14px;line-height:1.5;">${s.bullets.map((b) => `<li style="margin-bottom:8px;">${escapeHtml(b)}</li>`).join("")}</ul>`
        : "";
      return `<div style="margin-bottom:24px;">
        <h2 style="font-size:16px;font-weight:700;color:#18181b;margin:0 0 8px;border-bottom:2px solid #CCFF00;padding-bottom:4px;display:inline-block;">${escapeHtml(s.title)}</h2>
        ${s.body.map((p) => `<p style="margin:4px 0;font-size:14px;color:#52525b;line-height:1.5;">${escapeHtml(p)}</p>`).join("")}
        ${bullets}
      </div>`;
    })
    .join("");

  const priorityHtml = analysis.priorities
    .map((p, i) => `<li style="margin-bottom:6px;font-size:14px;color:#18181b;"><strong>${i + 1}.</strong> ${escapeHtml(p)}</li>`)
    .join("");

  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #e4e4e7;max-width:600px;width:100%;">
<tr><td style="padding:32px 28px 16px;">
  <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#71717a;">finalREV · PR</p>
  <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#18181b;">Weekly Brief</h1>
  <p style="margin:0;font-size:13px;color:#71717a;">${escapeHtml(analysis.periodLabel)}</p>
</td></tr>
<tr><td style="padding:0 28px 20px;">
  <div style="background:#fafafa;border-left:4px solid #CCFF00;padding:16px 18px;border-radius:0 4px 4px 0;">
    <p style="margin:0;font-size:15px;line-height:1.55;color:#27272a;font-weight:500;">${escapeHtml(analysis.executiveSummary)}</p>
  </div>
</td></tr>
<tr><td style="padding:0 28px 24px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:4px;overflow:hidden;">
    ${metricRows}
  </table>
</td></tr>
<tr><td style="padding:0 28px 28px;">
  ${sectionHtml}
  <div style="margin-top:8px;">
    <h2 style="font-size:16px;font-weight:700;color:#18181b;margin:0 0 8px;">This week's priorities</h2>
    <ol style="margin:0;padding-left:20px;">${priorityHtml}</ol>
  </div>
  <p style="margin:28px 0 0;text-align:center;">
    <a href="${escapeHtml(analysis.hubUrl)}" style="background:#CCFF00;color:#18181b;padding:14px 28px;font-size:15px;font-weight:600;text-decoration:none;display:inline-block;">Open PR Command Center</a>
  </p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

export function buildWeeklyBriefAnalysis(input: BuildInput): WeeklyBriefAnalysis | null {
  const { report, context } = input;
  if (!report) return null;

  const analytics = analyzeHistory(input.history, input.weekStart, input.previousReport);
  const posts = parsePostHighlights(report.post_highlights_json);
  const hubUrl = process.env.APP_PUBLIC_URL?.trim() || PRODUCTION_TEAM_URL;

  const intelInput = buildIntelligenceInput(
    input.weekStart,
    report,
    input.previousReport,
    input.history,
    input.channels,
    input.context,
  );
  const intel = buildWeeklyIntelligence(intelInput);

  const executiveSummary = report.learning?.trim() || intel.boardNarrative;
  const metrics = buildMetrics(input);
  const sections: BriefSection[] = [
    {
      title: "Priorities",
      body: [
        `Priority: ${intel.prescription.doFirst}`,
        `Deprioritize: ${intel.prescription.ignore}`,
        `Weekly focus: ${intel.prescription.betOfWeek}`,
        intel.contentPnl.headline,
      ],
    },
    sectionWhatsWorking(report, posts),
    sectionWhatsNotWorking(report, posts),
    sectionOpportunities(input, analytics),
  ];

  const postSection = sectionPostPerformance(posts);
  if (postSection) sections.push(postSection);

  const refSection = sectionReferrers(report);
  if (refSection) sections.push(refSection);

  const funnel = parseFunnel(report);
  if (isStripeSubsUnconfigured(funnel?.subscriptionEventUsed)) {
    logOps(
      "Pro subscription count comes from PostHog, not Stripe — STRIPE_SECRET_KEY is not set in the PR hub. Validate sub numbers against Slack billing alerts before sharing externally.",
    );
  }

  const periodLabel = context.isMultiWeekReport
    ? `${context.activityLabel} (${context.periodDays}-day report)`
    : context.activityLabel;

  const subject = `PR Weekly · ${periodLabel} · ${formatNumber(report.metricool_video_views)} views, ${formatNumber(report.posthog_visitors)} Tooltrace visitors`;

  const core = {
    subject,
    periodLabel,
    executiveSummary,
    metrics,
    sections,
    priorities: buildPriorities(input),
    hubUrl,
  };

  return {
    ...core,
    plainText: renderPlainText(core),
    html: renderHtml(core),
  };
}
