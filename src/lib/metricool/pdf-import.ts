import { parseMetricoolPdfBuffer } from "@/lib/metricool/pdf-parser";
import { analyzeGrowthFunnel, buildCombinedLearning, formatGrowthInsights } from "@/lib/metricool/insights";
import {
  upsertMetricoolSync,
  upsertPostHogSync,
  getWeeklyReport,
  saveMetricoolPdf,
  updatePostHighlights,
} from "@/lib/db";
import { isRedditSetupNeeded } from "@/lib/channels";
import { isPostHogConfigured } from "@/lib/posthog/config";
import { fetchWeeklyPostHogMetrics, fetchPostHogMetricsForPeriod } from "@/lib/posthog/metrics";
import { analyzePostHogWeek, formatInsightsForStorage } from "@/lib/posthog/insights";
import { getPreviousWeekKey } from "@/lib/weeks";
import { SOCIAL_PLATFORM_SLUGS } from "@/lib/platforms";
import { buildActionItems } from "@/lib/action-items";
import { fetchFinalRevCadUploadsForPeriod, fetchFinalRevCadUploadsForWeek } from "@/lib/posthog/finalrev-metrics";
import { syncFreeChannelStats } from "@/lib/social/sync";
import { buildDashboardPeriodContext } from "@/lib/period-context";
import { postWeeklyDigest } from "@/lib/slack/weekly-digest";
import { canAttributeSocialToTooltrace, resolveContentFocus } from "@/lib/intelligence/content-focus";
import { parsePostHighlights, serializePostHighlights, type PostHighlight } from "@/lib/post-highlights";
import type { ParsedPdfPost } from "@/lib/metricool/pdf-post-parser";
import fs from "fs";
import path from "path";
import type { WeeklyReport } from "@/lib/db";

const REPORTS_DIR = path.join(process.cwd(), "data", "reports");

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function mergePdfPostsIntoHighlights(
  existingJson: string | null | undefined,
  pdfPosts: ParsedPdfPost[],
): string {
  const existing = parsePostHighlights(existingJson);
  const manual = existing.filter((p) => !p.id.startsWith("metricool-"));
  const byKey = new Map<string, PostHighlight>();

  for (const post of manual) {
    byKey.set(`${post.platform}:${post.publishedAt ?? ""}:${post.title.slice(0, 48).toLowerCase()}`, post);
  }

  for (const post of pdfPosts) {
    const highlight: PostHighlight = {
      id: `metricool-x-${post.publishedAt ?? "unknown"}-${slugify(post.title)}`,
      platform: post.platform,
      title: post.title,
      views: post.views,
      likes: post.likes,
      publishedAt: post.publishedAt,
      product: "finalrev",
      format: post.format,
      notes: "Imported from Metricool PDF",
    };
    const key = `${highlight.platform}:${highlight.publishedAt ?? ""}:${highlight.title.slice(0, 48).toLowerCase()}`;
    if (!byKey.has(key)) {
      byKey.set(key, highlight);
    }
  }

  return serializePostHighlights([...byKey.values()].sort((a, b) => b.views - a.views));
}

function localReportsBackup(weekStart: string, filename: string, buffer: Buffer) {
  if (process.env.VERCEL) return;
  try {
    if (!fs.existsSync(REPORTS_DIR)) {
      fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }
    fs.writeFileSync(path.join(REPORTS_DIR, `${weekStart}-${filename}`), buffer);
  } catch {
    // Local backup is best-effort only
  }
}

export type MetricoolPdfImportResult =
  | {
      ok: true;
      weekStart: string;
      periodLabel: string;
      filename: string;
      views: number;
      engagement: number;
      report: WeeklyReport;
      posthogWarning?: string;
    }
  | { ok: false; error: string };

export async function importMetricoolPdfBuffer(
  buffer: Buffer,
  filename: string,
  weekOverride?: string | null,
): Promise<MetricoolPdfImportResult> {
  try {
    const parsed = await parseMetricoolPdfBuffer(buffer, filename);
    const weekStart = weekOverride || parsed.weekStart;

    await saveMetricoolPdf({
      weekStart,
      filename: parsed.sourceFilename || filename,
      fileData: buffer,
      periodLabel: parsed.periodLabel,
    });

    localReportsBackup(weekStart, parsed.sourceFilename || filename, buffer);

    const breakdown = {
      ...parsed.metrics,
      periodLabel: parsed.periodLabel,
      periodStart: parsed.periodStart,
      periodEnd: parsed.periodEnd,
      periodDays: parsed.periodDays,
      source: "pdf",
      sourceFilename: parsed.sourceFilename,
      parsedAt: new Date().toISOString(),
      extras: parsed.extras,
    };

    let posthogMetrics = null;
    let posthogError: string | null = null;
    if (isPostHogConfigured()) {
      try {
        posthogMetrics =
          parsed.periodDays > 7
            ? await fetchPostHogMetricsForPeriod(parsed.periodStart, parsed.periodEnd, weekStart)
            : await fetchWeeklyPostHogMetrics(weekStart);
      } catch (error) {
        posthogError = error instanceof Error ? error.message : "PostHog fetch failed";
      }
    }

    const prevReport = await getWeeklyReport(getPreviousWeekKey(weekStart));
    const existingForPosts = await getWeeklyReport(weekStart);
    const previousMetricool = prevReport?.metricool_breakdown_json
      ? JSON.parse(prevReport.metricool_breakdown_json)
      : null;

    const analysisContext = {
      periodDays: parsed.periodDays,
      periodLabel: parsed.periodLabel,
      redditSetupNeeded: await isRedditSetupNeeded(),
      socialLinkedToTooltrace: canAttributeSocialToTooltrace(
        resolveContentFocus(parsePostHighlights(existingForPosts?.post_highlights_json)),
      ),
    };

    const growthInsights = analyzeGrowthFunnel(
      parsed.metrics,
      posthogMetrics,
      previousMetricool,
      analysisContext,
    );

    const combinedLearning = buildCombinedLearning(parsed.metrics, posthogMetrics, analysisContext);

    const channelUpdates = SOCIAL_PLATFORM_SLUGS.map((slug) => ({
      slug,
      current_value: parsed.metrics.platforms.find((p) => p.platform === slug)?.followers ?? 0,
    }));

    const actionItemsJson = JSON.stringify(
      buildActionItems(
        growthInsights,
        posthogMetrics ? analyzePostHogWeek(posthogMetrics, null, prevReport, null).insights : [],
        undefined,
      ),
    );

    let report = await upsertMetricoolSync(weekStart, {
      videoViews: parsed.metrics.totalVideoViews,
      engagement: parsed.metrics.totalEngagement,
      breakdownJson: JSON.stringify(breakdown),
      growthInsights: formatGrowthInsights(growthInsights),
      channelUpdates,
      learning: combinedLearning || undefined,
      actionItemsJson,
    });

    if (parsed.parsedPosts.length > 0) {
      const mergedPosts = mergePdfPostsIntoHighlights(
        existingForPosts?.post_highlights_json,
        parsed.parsedPosts,
      );
      await updatePostHighlights(weekStart, mergedPosts);
      report = (await getWeeklyReport(weekStart)) ?? report;
    }

    await syncFreeChannelStats();

    if (posthogMetrics) {
      const posthogAnalysis = analyzePostHogWeek(posthogMetrics, null, prevReport, report);

      let finalRevUploads = 0;
      if (posthogMetrics.periodStart && posthogMetrics.periodEnd) {
        finalRevUploads = await fetchFinalRevCadUploadsForPeriod(
          posthogMetrics.periodStart,
          posthogMetrics.periodEnd,
          `${posthogMetrics.periodStart}_${posthogMetrics.periodEnd}`,
        );
      } else {
        finalRevUploads = await fetchFinalRevCadUploadsForWeek(weekStart);
      }

      report = await upsertPostHogSync(weekStart, {
        visitors: posthogMetrics.uniqueVisitors,
        subscriptions: posthogMetrics.newSubscriptions,
        insights: formatInsightsForStorage(posthogAnalysis),
        funnelJson: JSON.stringify({
          funnel: posthogMetrics.funnel,
          topReferrers: posthogMetrics.topReferrers,
          subscriptionEventUsed: posthogMetrics.subscriptionEventUsed,
          finalrevCadUploads: finalRevUploads,
          periodStart: posthogMetrics.periodStart,
          periodEnd: posthogMetrics.periodEnd,
          fetchedAt: posthogMetrics.fetchedAt,
          analysis: {
            conversionRate: posthogAnalysis.conversionRate,
            activationRate: posthogAnalysis.activationRate,
            suggestedFindings: posthogAnalysis.suggestedFindings,
          },
        }),
        learning: posthogAnalysis.suggestedLearning || undefined,
      });
    }

    const context = buildDashboardPeriodContext(weekStart, report);
    await postWeeklyDigest({ weekStart, report, context, source: "pdf" });

    return {
      ok: true,
      weekStart,
      periodLabel: parsed.periodLabel,
      filename: parsed.sourceFilename || filename,
      views: parsed.metrics.totalVideoViews,
      engagement: parsed.metrics.totalEngagement,
      report,
      posthogWarning: posthogError ?? undefined,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to parse PDF",
    };
  }
}
