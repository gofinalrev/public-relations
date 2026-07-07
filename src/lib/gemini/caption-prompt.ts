import type { Channel, WeeklyReport } from "@/lib/db";
import type { DashboardPeriodContext } from "@/lib/period-context";
import { parseStoredInsights } from "@/lib/action-items";
import { buildPrContentIdeas } from "@/lib/pr-toolkit/content-ideas";
import { analyzePostHighlights, parsePostHighlights } from "@/lib/post-highlights";
import {
  type ContentArchetype,
  MARKET_LANDSCAPE,
  archetypeGuidance,
  optionStyleMenu,
  platformPlaybook,
} from "@/lib/pr-toolkit/market-intelligence";
import type { CaptionBrand, CaptionPlatform } from "@/lib/pr-toolkit/voice-guides";
import { platformCaptionHints } from "@/lib/pr-toolkit/voice-guides";

export type CaptionWeekContext = {
  summary: string;
  postPerformance?: string;
};

export function buildCaptionWeekContext(
  report: WeeklyReport | null,
  channels: Channel[],
  context: DashboardPeriodContext,
): CaptionWeekContext {
  const growth = parseStoredInsights(report?.growth_insights ?? "");
  const posthog = parseStoredInsights(report?.posthog_insights ?? "");
  const top = [...growth, ...posthog][0];
  const ideas = buildPrContentIdeas(report, channels, context).slice(0, 3);

  const lines: string[] = [`Reporting period: ${context.activityLabel}.`];

  if (report) {
    lines.push(
      `Funnel snapshot: ${report.metricool_video_views.toLocaleString()} social views, ${report.posthog_visitors.toLocaleString()} Tooltrace visitors, ${report.posthog_subscriptions} Pro subs this period.`,
    );
  }

  if (top) lines.push(`Top insight: ${top.title}. ${top.body}`);
  for (const idea of ideas) {
    lines.push(`Content angle: ${idea.title}. ${idea.body}`);
  }

  const posts = parsePostHighlights(report?.post_highlights_json);
  let postPerformance: string | undefined;
  if (posts.length > 0) {
    const insights = analyzePostHighlights(posts);
    const topPosts = [...posts]
      .sort((a, b) => b.views - a.views)
      .slice(0, 3)
      .map((p) => `"${p.title}" ${p.views.toLocaleString()} views on ${p.platform}`)
      .join("; ");
    lines.push(`Recent post performance (manual): ${topPosts}.`);
    if (insights[0]) {
      lines.push(`Performance note: ${insights[0].title}. ${insights[0].body}`);
    }
    postPerformance = topPosts;
  }

  return { summary: lines.join("\n"), postPerformance };
}

export function buildCaptionSystemPrompt(input: {
  brand: CaptionBrand;
  platforms: CaptionPlatform[];
  archetype: ContentArchetype;
  xThreadMode: boolean;
  voiceGuide: string;
}): string {
  const platformBlock = input.platforms
    .map((p) => `- ${p}:\n  ${platformCaptionHints(p)}\n  ${platformPlaybook(p, input.brand)}`)
    .join("\n");

  return [
    input.voiceGuide,
    "",
    MARKET_LANDSCAPE,
    "",
    "## archetype for this video",
    archetypeGuidance(input.archetype, input.brand),
    "",
    optionStyleMenu(input.brand),
    "",
    "## platforms",
    platformBlock,
    "",
    "## quality bar",
    "Write like a senior copywriter at a design-forward manufacturing brand (Pentagram clarity + shop-floor credibility). Every option must feel distinct in hook, structure, and CTA placement.",
    "Upgrade loose transcript language to correct CNC/maker terminology.",
    "Never invent specs, prices, lead times, or customer names not in the transcript.",
    "No em dashes. No 'excited to announce.' No competitor names.",
    input.xThreadMode && input.platforms.includes("x")
      ? "X thread mode: each x option is exactly 3 parts (1/3, 2/3, 3/3), each under 280 weighted characters."
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildCaptionUserPrompt(input: {
  brand: CaptionBrand;
  transcript: string;
  videoNotes?: string;
  weekContext?: string;
  archetype: ContentArchetype;
  ctaUrl: string;
}): string {
  return [
    "From the transcript below, generate social captions.",
    "",
    "Step 1 (internal): identify the single best visual hook moment and the primary audience (machinist, engineer, founder, maker).",
    "Step 2: write 4 options per platform with different styles from the menu.",
    "",
    input.archetype !== "auto"
      ? `Preferred archetype: ${input.archetype.replace(/_/g, " ")}`
      : "Detect archetype from transcript.",
    "",
    input.videoNotes?.trim() ? `## video notes\n${input.videoNotes.trim()}` : "",
    input.weekContext?.trim() ? `## this week's dashboard context\n${input.weekContext.trim()}` : "",
    "",
    "## transcript",
    input.transcript.trim(),
    "",
    `Natural CTA destination: ${input.ctaUrl}. YouTube: CTA block at bottom. IG/TikTok: last line. LinkedIn: end paragraph. X: only if chars allow.`,
  ]
    .filter(Boolean)
    .join("\n");
}
