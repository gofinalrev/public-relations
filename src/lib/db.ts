import { createClient, type Client } from "@libsql/client";
import path from "path";
import fs from "fs";
import { getPreviousWeekKey } from "./weeks";

export type WeeklyReport = {
  id: number;
  week_start: string;
  metricool_video_views: number;
  metricool_engagement: number;
  posthog_visitors: number;
  posthog_subscriptions: number;
  learning: string;
  locked_findings: string;
  posthog_insights: string;
  posthog_funnel_json: string;
  posthog_synced_at: string | null;
  metricool_breakdown_json: string;
  metricool_synced_at: string | null;
  growth_insights: string;
  action_items_json: string;
  caption_studio_json: string;
  post_highlights_json: string;
  intelligence_json: string;
  created_at: string;
  updated_at: string;
};

export type Channel = {
  id: number;
  slug: string;
  name: string;
  platform: string;
  profile_url: string;
  status: "active" | "setup_needed" | "planned" | "achieved";
  goal_metric: string;
  goal_target: number;
  goal_label: string;
  current_value: number;
  notes: string;
  sort_order: number;
  updated_at: string;
};

export type WeeklyReportInput = Omit<WeeklyReport, "id" | "created_at" | "updated_at" | "intelligence_json"> & {
  intelligence_json?: string;
};
export type ChannelInput = Omit<Channel, "id" | "updated_at">;

export type MetricoolPdfMeta = {
  week_start: string;
  filename: string;
  file_size: number;
  period_label: string;
  uploaded_at: string;
};

const DB_DIR = process.env.DATA_DIR?.trim() || path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "social-hq.db");

let client: Client | null = null;
let ready: Promise<void> | null = null;

function getClient(): Client {
  if (client) return client;

  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
  const tursoToken = process.env.TURSO_AUTH_TOKEN?.trim();

  if (tursoUrl) {
    client = createClient({ url: tursoUrl, authToken: tursoToken });
    return client;
  }

  if (process.env.VERCEL) {
    throw new Error(
      "TURSO_DATABASE_URL is required on Vercel. Run: bash scripts/setup-turso.sh then add secrets to Vercel.",
    );
  }

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  client = createClient({ url: `file:${DB_PATH}` });
  return client;
}

async function ensureReady(): Promise<void> {
  if (!ready) ready = initSchema();
  await ready;
}

function rowVal(row: Record<string, unknown>, key: string): unknown {
  return row[key] ?? row[key.toLowerCase()];
}

function parseWeeklyReport(row: Record<string, unknown>): WeeklyReport {
  return {
    id: Number(rowVal(row, "id")),
    week_start: String(rowVal(row, "week_start")),
    metricool_video_views: Number(rowVal(row, "metricool_video_views")),
    metricool_engagement: Number(rowVal(row, "metricool_engagement")),
    posthog_visitors: Number(rowVal(row, "posthog_visitors")),
    posthog_subscriptions: Number(rowVal(row, "posthog_subscriptions")),
    learning: String(rowVal(row, "learning") ?? ""),
    locked_findings: String(rowVal(row, "locked_findings") ?? ""),
    posthog_insights: String(rowVal(row, "posthog_insights") ?? ""),
    posthog_funnel_json: String(rowVal(row, "posthog_funnel_json") ?? ""),
    posthog_synced_at: rowVal(row, "posthog_synced_at") ? String(rowVal(row, "posthog_synced_at")) : null,
    metricool_breakdown_json: String(rowVal(row, "metricool_breakdown_json") ?? ""),
    metricool_synced_at: rowVal(row, "metricool_synced_at") ? String(rowVal(row, "metricool_synced_at")) : null,
    growth_insights: String(rowVal(row, "growth_insights") ?? ""),
    action_items_json: String(rowVal(row, "action_items_json") ?? "[]"),
    caption_studio_json: String(rowVal(row, "caption_studio_json") ?? "{}"),
    post_highlights_json: String(rowVal(row, "post_highlights_json") ?? "{}"),
    intelligence_json: String(rowVal(row, "intelligence_json") ?? ""),
    created_at: String(rowVal(row, "created_at")),
    updated_at: String(rowVal(row, "updated_at")),
  };
}

function parseChannel(row: Record<string, unknown>): Channel {
  return {
    id: Number(rowVal(row, "id")),
    slug: String(rowVal(row, "slug")),
    name: String(rowVal(row, "name")),
    platform: String(rowVal(row, "platform")),
    profile_url: String(rowVal(row, "profile_url") ?? ""),
    status: String(rowVal(row, "status")) as Channel["status"],
    goal_metric: String(rowVal(row, "goal_metric")),
    goal_target: Number(rowVal(row, "goal_target")),
    goal_label: String(rowVal(row, "goal_label")),
    current_value: Number(rowVal(row, "current_value")),
    notes: String(rowVal(row, "notes") ?? ""),
    sort_order: Number(rowVal(row, "sort_order")),
    updated_at: String(rowVal(row, "updated_at")),
  };
}

async function initSchema(): Promise<void> {
  const db = getClient();
  await db.batch([
    `CREATE TABLE IF NOT EXISTS weekly_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_start TEXT NOT NULL UNIQUE,
      metricool_video_views INTEGER NOT NULL DEFAULT 0,
      metricool_engagement INTEGER NOT NULL DEFAULT 0,
      posthog_visitors INTEGER NOT NULL DEFAULT 0,
      posthog_subscriptions INTEGER NOT NULL DEFAULT 0,
      learning TEXT NOT NULL DEFAULT '',
      locked_findings TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      platform TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      goal_metric TEXT NOT NULL,
      goal_target INTEGER NOT NULL,
      goal_label TEXT NOT NULL,
      current_value INTEGER NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '',
      profile_url TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS metricool_pdf_files (
      week_start TEXT NOT NULL PRIMARY KEY,
      filename TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      period_label TEXT NOT NULL DEFAULT '',
      file_data BLOB NOT NULL,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
  ]);
  await migrateSchema(db);
}

async function migrateSchema(db: Client): Promise<void> {
  const columns = await db.execute("PRAGMA table_info(weekly_reports)");
  const names = new Set(columns.rows.map((r) => String(rowVal(r, "name"))));

  const alters: string[] = [];
  if (!names.has("posthog_insights")) alters.push("ALTER TABLE weekly_reports ADD COLUMN posthog_insights TEXT NOT NULL DEFAULT ''");
  if (!names.has("posthog_funnel_json")) alters.push("ALTER TABLE weekly_reports ADD COLUMN posthog_funnel_json TEXT NOT NULL DEFAULT ''");
  if (!names.has("posthog_synced_at")) alters.push("ALTER TABLE weekly_reports ADD COLUMN posthog_synced_at TEXT");
  if (!names.has("metricool_breakdown_json")) alters.push("ALTER TABLE weekly_reports ADD COLUMN metricool_breakdown_json TEXT NOT NULL DEFAULT ''");
  if (!names.has("metricool_synced_at")) alters.push("ALTER TABLE weekly_reports ADD COLUMN metricool_synced_at TEXT");
  if (!names.has("growth_insights")) alters.push("ALTER TABLE weekly_reports ADD COLUMN growth_insights TEXT NOT NULL DEFAULT ''");
  if (!names.has("action_items_json")) alters.push("ALTER TABLE weekly_reports ADD COLUMN action_items_json TEXT NOT NULL DEFAULT '[]'");
  if (!names.has("caption_studio_json")) alters.push("ALTER TABLE weekly_reports ADD COLUMN caption_studio_json TEXT NOT NULL DEFAULT '{}'");
  if (!names.has("post_highlights_json")) alters.push("ALTER TABLE weekly_reports ADD COLUMN post_highlights_json TEXT NOT NULL DEFAULT '{}'");
  if (!names.has("intelligence_json")) alters.push("ALTER TABLE weekly_reports ADD COLUMN intelligence_json TEXT NOT NULL DEFAULT ''");

  for (const sql of alters) {
    await db.execute(sql);
  }

  const channelCols = await db.execute("PRAGMA table_info(channels)");
  if (!channelCols.rows.some((c) => String(rowVal(c, "name")) === "profile_url")) {
    await db.execute("ALTER TABLE channels ADD COLUMN profile_url TEXT NOT NULL DEFAULT ''");
  }

  await db.execute("UPDATE channels SET status = 'active' WHERE slug = 'reddit' AND status = 'setup_needed'");
  await syncChannelDefinitions(db);
  await seedChannels(db);
}

const CHANNEL_DEFINITIONS: Omit<ChannelInput, "id">[] = [
  {
    slug: "youtube",
    name: "YouTube",
    platform: "youtube",
    profile_url: "https://www.youtube.com/@gofinalrev",
    status: "active",
    goal_metric: "subscribers",
    goal_target: 1000,
    goal_label: "1,000 subscribers — YouTube Partner Program",
    current_value: 0,
    notes: "All-time subs toward YPP (also need 4K watch hours). Synced via YouTube API or Metricool PDF.",
    sort_order: 1,
  },
  {
    slug: "x",
    name: "X",
    platform: "x",
    profile_url: "https://x.com/gofinalrev",
    status: "active",
    goal_metric: "followers",
    goal_target: 5000,
    goal_label: "5,000 followers on X",
    current_value: 337,
    notes: "All-time followers · Premium+ active. Product-demo posts outperform aesthetic-only.",
    sort_order: 2,
  },
  {
    slug: "instagram",
    name: "Instagram",
    platform: "instagram",
    profile_url: "https://instagram.com/gofinalrev",
    status: "active",
    goal_metric: "followers",
    goal_target: 1000,
    goal_label: "1,000 Instagram followers",
    current_value: 0,
    notes: "All-time followers · Reels + carousel. Bio link to tooltrace.ai.",
    sort_order: 3,
  },
  {
    slug: "linkedin",
    name: "LinkedIn",
    platform: "linkedin",
    profile_url: "https://www.linkedin.com/company/finalrev",
    status: "active",
    goal_metric: "followers",
    goal_target: 1000,
    goal_label: "1,000 LinkedIn followers",
    current_value: 243,
    notes: "All-time company followers · B2B shop-floor content → finalrev.com quotes.",
    sort_order: 4,
  },
  {
    slug: "tiktok",
    name: "TikTok",
    platform: "tiktok",
    profile_url: "https://www.tiktok.com/@gofinalrev",
    status: "active",
    goal_metric: "followers",
    goal_target: 1000,
    goal_label: "1,000 TikTok followers",
    current_value: 0,
    notes: "All-time followers · cross-post YouTube Shorts.",
    sort_order: 5,
  },
  {
    slug: "facebook",
    name: "Facebook",
    platform: "facebook",
    profile_url: "https://www.facebook.com/gofinalrev",
    status: "active",
    goal_metric: "followers",
    goal_target: 1000,
    goal_label: "1,000 Facebook page likes",
    current_value: 0,
    notes: "All-time page likes · repurpose shop-floor + CAD content.",
    sort_order: 6,
  },
  {
    slug: "reddit",
    name: "Reddit",
    platform: "reddit",
    profile_url: "https://www.reddit.com/r/finalrev",
    status: "active",
    goal_metric: "members",
    goal_target: 100,
    goal_label: "100 r/finalrev members",
    current_value: 0,
    notes: "All-time subreddit members · synced from Reddit API.",
    sort_order: 7,
  },
  {
    slug: "finalrev-web",
    name: "finalREV.com",
    platform: "web",
    profile_url: "https://www.finalrev.com",
    status: "active",
    goal_metric: "CAD uploads",
    goal_target: 50,
    goal_label: "50 STEP uploads per week on finalrev.com",
    current_value: 0,
    notes: "Period count from PostHog cad_upload — resets each reporting week.",
    sort_order: 8,
  },
  {
    slug: "tooltrace-web",
    name: "Tooltrace.ai",
    platform: "web",
    profile_url: "https://www.tooltrace.ai",
    status: "active",
    goal_metric: "new Pro subs",
    goal_target: 10,
    goal_label: "10 new Tooltrace Pro subs per week",
    current_value: 0,
    notes: "New subs in the selected period only — from Stripe (not all-time total).",
    sort_order: 9,
  },
];

async function syncChannelDefinitions(db: Client): Promise<void> {
  for (const ch of CHANNEL_DEFINITIONS) {
    await db.execute({
      sql: `INSERT INTO channels (slug, name, platform, profile_url, status, goal_metric, goal_target, goal_label, current_value, notes, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(slug) DO UPDATE SET
              name = excluded.name,
              platform = excluded.platform,
              profile_url = excluded.profile_url,
              goal_metric = excluded.goal_metric,
              goal_label = excluded.goal_label,
              goal_target = excluded.goal_target,
              notes = excluded.notes,
              sort_order = excluded.sort_order,
              updated_at = datetime('now')`,
      args: [
        ch.slug, ch.name, ch.platform, ch.profile_url, ch.status, ch.goal_metric,
        ch.goal_target, ch.goal_label, ch.current_value, ch.notes, ch.sort_order,
      ],
    });
  }
  await db.execute("DELETE FROM channels WHERE slug IN ('youtube-subs', 'youtube-hours', 'x-premium', 'x-followers')");
}

async function seedChannels(db: Client): Promise<void> {
  const count = await db.execute("SELECT COUNT(*) as c FROM channels");
  const c = Number(rowVal(count.rows[0], "c"));
  if (c > 0) return;

  for (const ch of CHANNEL_DEFINITIONS) {
    await db.execute({
      sql: `INSERT INTO channels (slug, name, platform, profile_url, status, goal_metric, goal_target, goal_label, current_value, notes, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        ch.slug, ch.name, ch.platform, ch.profile_url, ch.status, ch.goal_metric,
        ch.goal_target, ch.goal_label, ch.current_value, ch.notes, ch.sort_order,
      ],
    });
  }
}

export async function getAppSetting(key: string): Promise<string | null> {
  await ensureReady();
  const result = await getClient().execute({
    sql: "SELECT value FROM app_settings WHERE key = ?",
    args: [key],
  });
  const value = result.rows[0] ? String(rowVal(result.rows[0], "value")) : "";
  return value || null;
}

export async function setAppSetting(key: string, value: string): Promise<void> {
  await ensureReady();
  await getClient().execute({
    sql: `INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
    args: [key, value],
  });
}

export async function updateIntelligenceJson(weekStart: string, json: string): Promise<void> {
  await ensureReady();
  const existing = await getWeeklyReport(weekStart);
  if (!existing) {
    await upsertWeeklyReport({
      week_start: weekStart,
      metricool_video_views: 0,
      metricool_engagement: 0,
      posthog_visitors: 0,
      posthog_subscriptions: 0,
      learning: "",
      locked_findings: "",
      posthog_insights: "",
      posthog_funnel_json: "",
      posthog_synced_at: null,
      metricool_breakdown_json: "",
      metricool_synced_at: null,
      growth_insights: "",
      action_items_json: "[]",
      caption_studio_json: "{}",
      post_highlights_json: "{}",
      intelligence_json: json,
    });
    return;
  }
  await getClient().execute({
    sql: "UPDATE weekly_reports SET intelligence_json = ?, updated_at = datetime('now') WHERE week_start = ?",
    args: [json, weekStart],
  });
}

export async function getWeeklyReport(weekStart: string): Promise<WeeklyReport | null> {
  await ensureReady();
  const result = await getClient().execute({
    sql: "SELECT * FROM weekly_reports WHERE week_start = ?",
    args: [weekStart],
  });
  if (result.rows.length === 0) return null;
  return parseWeeklyReport(result.rows[0]);
}

export async function getAllWeeklyReports(limit = 52): Promise<WeeklyReport[]> {
  await ensureReady();
  const result = await getClient().execute({
    sql: "SELECT * FROM weekly_reports ORDER BY week_start DESC LIMIT ?",
    args: [limit],
  });
  return result.rows.map((r) => parseWeeklyReport(r));
}

export async function upsertWeeklyReport(data: WeeklyReportInput): Promise<WeeklyReport> {
  await ensureReady();
  const existing = await getWeeklyReport(data.week_start);

  await getClient().execute({
    sql: `INSERT INTO weekly_reports (
      week_start, metricool_video_views, metricool_engagement,
      posthog_visitors, posthog_subscriptions, learning, locked_findings,
      posthog_insights, posthog_funnel_json, posthog_synced_at,
      metricool_breakdown_json, metricool_synced_at, growth_insights, action_items_json,
      caption_studio_json, post_highlights_json, intelligence_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(week_start) DO UPDATE SET
      metricool_video_views = excluded.metricool_video_views,
      metricool_engagement = excluded.metricool_engagement,
      posthog_visitors = excluded.posthog_visitors,
      posthog_subscriptions = excluded.posthog_subscriptions,
      learning = excluded.learning,
      locked_findings = excluded.locked_findings,
      posthog_insights = COALESCE(NULLIF(excluded.posthog_insights, ''), weekly_reports.posthog_insights),
      posthog_funnel_json = COALESCE(NULLIF(excluded.posthog_funnel_json, ''), weekly_reports.posthog_funnel_json),
      posthog_synced_at = COALESCE(excluded.posthog_synced_at, weekly_reports.posthog_synced_at),
      metricool_breakdown_json = COALESCE(NULLIF(excluded.metricool_breakdown_json, ''), weekly_reports.metricool_breakdown_json),
      metricool_synced_at = COALESCE(excluded.metricool_synced_at, weekly_reports.metricool_synced_at),
      growth_insights = COALESCE(NULLIF(excluded.growth_insights, ''), weekly_reports.growth_insights),
      action_items_json = COALESCE(NULLIF(excluded.action_items_json, ''), weekly_reports.action_items_json),
      caption_studio_json = COALESCE(NULLIF(excluded.caption_studio_json, ''), weekly_reports.caption_studio_json),
      post_highlights_json = COALESCE(NULLIF(excluded.post_highlights_json, ''), weekly_reports.post_highlights_json),
      intelligence_json = COALESCE(NULLIF(excluded.intelligence_json, ''), weekly_reports.intelligence_json),
      updated_at = datetime('now')`,
    args: [
      data.week_start,
      data.metricool_video_views,
      data.metricool_engagement,
      data.posthog_visitors,
      data.posthog_subscriptions,
      data.learning,
      data.locked_findings,
      data.posthog_insights ?? existing?.posthog_insights ?? "",
      data.posthog_funnel_json ?? existing?.posthog_funnel_json ?? "",
      data.posthog_synced_at ?? existing?.posthog_synced_at ?? null,
      data.metricool_breakdown_json ?? existing?.metricool_breakdown_json ?? "",
      data.metricool_synced_at ?? existing?.metricool_synced_at ?? null,
      data.growth_insights ?? existing?.growth_insights ?? "",
      data.action_items_json ?? existing?.action_items_json ?? "[]",
      data.caption_studio_json ?? existing?.caption_studio_json ?? "{}",
      data.post_highlights_json ?? existing?.post_highlights_json ?? "{}",
      data.intelligence_json ?? existing?.intelligence_json ?? "",
    ],
  });

  return (await getWeeklyReport(data.week_start))!;
}

export async function updateCaptionStudio(weekStart: string, captionStudioJson: string): Promise<void> {
  const existing = await getWeeklyReport(weekStart);
  if (!existing) {
    await upsertWeeklyReport({
      week_start: weekStart,
      metricool_video_views: 0,
      metricool_engagement: 0,
      posthog_visitors: 0,
      posthog_subscriptions: 0,
      learning: "",
      locked_findings: "",
      posthog_insights: "",
      posthog_funnel_json: "",
      posthog_synced_at: null,
      metricool_breakdown_json: "",
      metricool_synced_at: null,
      growth_insights: "",
      action_items_json: "[]",
      caption_studio_json: captionStudioJson,
      post_highlights_json: "{}",
      intelligence_json: "",
    });
    return;
  }
  await ensureReady();
  await getClient().execute({
    sql: "UPDATE weekly_reports SET caption_studio_json = ?, updated_at = datetime('now') WHERE week_start = ?",
    args: [captionStudioJson, weekStart],
  });
}

export async function updatePostHighlights(weekStart: string, postHighlightsJson: string): Promise<void> {
  const existing = await getWeeklyReport(weekStart);
  if (!existing) {
    await upsertWeeklyReport({
      week_start: weekStart,
      metricool_video_views: 0,
      metricool_engagement: 0,
      posthog_visitors: 0,
      posthog_subscriptions: 0,
      learning: "",
      locked_findings: "",
      posthog_insights: "",
      posthog_funnel_json: "",
      posthog_synced_at: null,
      metricool_breakdown_json: "",
      metricool_synced_at: null,
      growth_insights: "",
      action_items_json: "[]",
      caption_studio_json: "{}",
      post_highlights_json: postHighlightsJson,
      intelligence_json: "",
    });
    return;
  }
  await ensureReady();
  await getClient().execute({
    sql: "UPDATE weekly_reports SET post_highlights_json = ?, updated_at = datetime('now') WHERE week_start = ?",
    args: [postHighlightsJson, weekStart],
  });
}

export async function upsertPostHogSync(
  weekStart: string,
  payload: {
    visitors: number;
    subscriptions: number;
    insights: string;
    funnelJson: string;
    learning?: string;
  },
): Promise<WeeklyReport> {
  const existing = await getWeeklyReport(weekStart);
  return upsertWeeklyReport({
    week_start: weekStart,
    metricool_video_views: existing?.metricool_video_views ?? 0,
    metricool_engagement: existing?.metricool_engagement ?? 0,
    posthog_visitors: payload.visitors,
    posthog_subscriptions: payload.subscriptions,
    learning: payload.learning && !existing?.learning ? payload.learning : (existing?.learning ?? ""),
    locked_findings: existing?.locked_findings ?? "",
    posthog_insights: payload.insights,
    posthog_funnel_json: payload.funnelJson,
    posthog_synced_at: new Date().toISOString(),
    metricool_breakdown_json: existing?.metricool_breakdown_json ?? "",
    metricool_synced_at: existing?.metricool_synced_at ?? null,
    growth_insights: existing?.growth_insights ?? "",
    action_items_json: existing?.action_items_json ?? "[]",
    caption_studio_json: existing?.caption_studio_json ?? "{}",
    post_highlights_json: existing?.post_highlights_json ?? "{}",
    intelligence_json: existing?.intelligence_json ?? "",
  });
}

export async function upsertMetricoolSync(
  weekStart: string,
  payload: {
    videoViews: number;
    engagement: number;
    breakdownJson: string;
    growthInsights: string;
    channelUpdates: { slug: string; current_value: number }[];
    learning?: string;
    actionItemsJson?: string;
  },
): Promise<WeeklyReport> {
  const existing = await getWeeklyReport(weekStart);

  for (const ch of payload.channelUpdates) {
    await updateChannel(ch.slug, { current_value: ch.current_value });
  }

  return upsertWeeklyReport({
    week_start: weekStart,
    metricool_video_views: payload.videoViews,
    metricool_engagement: payload.engagement,
    posthog_visitors: existing?.posthog_visitors ?? 0,
    posthog_subscriptions: existing?.posthog_subscriptions ?? 0,
    learning: payload.learning && !existing?.learning ? payload.learning : (existing?.learning ?? ""),
    locked_findings: existing?.locked_findings ?? "",
    posthog_insights: existing?.posthog_insights ?? "",
    posthog_funnel_json: existing?.posthog_funnel_json ?? "",
    posthog_synced_at: existing?.posthog_synced_at ?? null,
    metricool_breakdown_json: payload.breakdownJson,
    metricool_synced_at: new Date().toISOString(),
    growth_insights: payload.growthInsights,
    action_items_json: payload.actionItemsJson ?? existing?.action_items_json ?? "[]",
    caption_studio_json: existing?.caption_studio_json ?? "{}",
    post_highlights_json: existing?.post_highlights_json ?? "{}",
    intelligence_json: existing?.intelligence_json ?? "",
  });
}

export async function updateActionItems(weekStart: string, actionItemsJson: string): Promise<void> {
  await ensureReady();
  await getClient().execute({
    sql: "UPDATE weekly_reports SET action_items_json = ?, updated_at = datetime('now') WHERE week_start = ?",
    args: [actionItemsJson, weekStart],
  });
}

export async function mergeGrowthInsights(weekStart: string, growthInsights: string): Promise<void> {
  const existing = await getWeeklyReport(weekStart);
  if (!existing) return;
  await ensureReady();
  await getClient().execute({
    sql: "UPDATE weekly_reports SET growth_insights = ?, updated_at = datetime('now') WHERE week_start = ?",
    args: [growthInsights, weekStart],
  });
}

export async function getAllChannels(): Promise<Channel[]> {
  await ensureReady();
  const result = await getClient().execute("SELECT * FROM channels ORDER BY sort_order ASC");
  return result.rows.map((r) => parseChannel(r));
}

export async function updateChannel(
  slug: string,
  updates: Partial<Pick<Channel, "current_value" | "status" | "notes" | "goal_target">>,
): Promise<Channel | null> {
  await ensureReady();
  const existingResult = await getClient().execute({
    sql: "SELECT * FROM channels WHERE slug = ?",
    args: [slug],
  });
  if (existingResult.rows.length === 0) return null;
  const existing = parseChannel(existingResult.rows[0]);

  const merged = {
    current_value: updates.current_value ?? existing.current_value,
    status: updates.status ?? existing.status,
    notes: updates.notes ?? existing.notes,
    goal_target: updates.goal_target ?? existing.goal_target,
  };

  await getClient().execute({
    sql: `UPDATE channels SET current_value = ?, status = ?, notes = ?, goal_target = ?, updated_at = datetime('now') WHERE slug = ?`,
    args: [merged.current_value, merged.status, merged.notes, merged.goal_target, slug],
  });

  const updated = await getClient().execute({
    sql: "SELECT * FROM channels WHERE slug = ?",
    args: [slug],
  });
  return parseChannel(updated.rows[0]);
}

export async function getDashboardData(weekStart: string) {
  const report = await getWeeklyReport(weekStart);
  const previousWeek = await getWeeklyReport(getPreviousWeekKey(weekStart));
  const history = (await getAllWeeklyReports(24)).reverse();
  const channels = await getAllChannels();

  return { report, previousWeek, history, channels, weekStart };
}

function parseMetricoolPdfMeta(row: Record<string, unknown>): MetricoolPdfMeta {
  return {
    week_start: String(rowVal(row, "week_start")),
    filename: String(rowVal(row, "filename")),
    file_size: Number(rowVal(row, "file_size")),
    period_label: String(rowVal(row, "period_label") ?? ""),
    uploaded_at: String(rowVal(row, "uploaded_at")),
  };
}

function rowBlob(row: Record<string, unknown>, key: string): Buffer {
  const value = rowVal(row, key);
  if (value instanceof Buffer) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (value instanceof ArrayBuffer) return Buffer.from(value);
  if (typeof value === "string") return Buffer.from(value, "binary");
  return Buffer.alloc(0);
}

export async function saveMetricoolPdf(params: {
  weekStart: string;
  filename: string;
  fileData: Buffer;
  periodLabel?: string;
}): Promise<void> {
  await ensureReady();
  await getClient().execute({
    sql: `INSERT INTO metricool_pdf_files (week_start, filename, file_size, period_label, file_data, uploaded_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'))
          ON CONFLICT(week_start) DO UPDATE SET
            filename = excluded.filename,
            file_size = excluded.file_size,
            period_label = excluded.period_label,
            file_data = excluded.file_data,
            uploaded_at = datetime('now')`,
    args: [
      params.weekStart,
      params.filename,
      params.fileData.length,
      params.periodLabel ?? "",
      params.fileData,
    ],
  });
}

export async function getMetricoolPdfMeta(weekStart: string): Promise<MetricoolPdfMeta | null> {
  await ensureReady();
  const result = await getClient().execute({
    sql: `SELECT week_start, filename, file_size, period_label, uploaded_at
          FROM metricool_pdf_files WHERE week_start = ?`,
    args: [weekStart],
  });
  if (result.rows.length === 0) return null;
  return parseMetricoolPdfMeta(result.rows[0] as Record<string, unknown>);
}

export async function getMetricoolPdfBuffer(
  weekStart: string,
): Promise<{ meta: MetricoolPdfMeta; data: Buffer } | null> {
  await ensureReady();
  const result = await getClient().execute({
    sql: "SELECT * FROM metricool_pdf_files WHERE week_start = ?",
    args: [weekStart],
  });
  if (result.rows.length === 0) return null;
  const row = result.rows[0] as Record<string, unknown>;
  return {
    meta: parseMetricoolPdfMeta(row),
    data: rowBlob(row, "file_data"),
  };
}

export async function listMetricoolPdfMetas(limit = 12): Promise<MetricoolPdfMeta[]> {
  await ensureReady();
  const result = await getClient().execute({
    sql: `SELECT week_start, filename, file_size, period_label, uploaded_at
          FROM metricool_pdf_files ORDER BY week_start DESC LIMIT ?`,
    args: [limit],
  });
  return result.rows.map((row) => parseMetricoolPdfMeta(row as Record<string, unknown>));
}
