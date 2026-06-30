import type { PostHighlight, PostHighlightPlatform } from "@/lib/post-highlights";

export type ContentPnl = {
  socialViews: number;
  tooltraceVisitors: number;
  proSubs: number;
  stepUploads: number;
  visitRate: number | null;
  conversionRate: number | null;
  quotePipelineLow: number;
  quotePipelineHigh: number;
  proValue: number;
  bestRoiClip: string | null;
  nextDollarMove: string;
  headline: string;
};

export type FunnelStoryStep = {
  label: string;
  value: number;
  rateFromPrev: number | null;
  track?: "social" | "tooltrace" | "finalrev";
};

export type FunnelStory = {
  steps: FunnelStoryStep[];
  narrative: string;
  /** linked = social may drive Tooltrace; parallel = separate tracks (finalREV-only era) */
  mode: "linked" | "parallel";
};

export type ClipAttribution = {
  postId: string;
  title: string;
  platform: PostHighlightPlatform;
  views: number;
  estimatedVisitors: number;
  roiScore: number;
  payoffNote: string;
};

export type WarRoomAlert = {
  active: boolean;
  severity: "hot" | "warm";
  title: string;
  body: string;
  pinnedComment: string;
  utmLink: string;
  followUp: string;
};

export type CompetitivePulse = {
  headline: string;
  yourStrength: string;
  gap: string;
  recommendation: string;
};

export type MondayQueueItem = {
  priority: number;
  title: string;
  body: string;
  platform?: string;
};

export type HookEntry = {
  id: string;
  hook: string;
  platform: PostHighlightPlatform;
  format?: string;
  avgViews: number;
  appearances: number;
  visitRateEstimate: number | null;
  status: "validated" | "hypothesis";
};

export type RepurposePlan = {
  sourceTitle: string;
  sourcePlatform: PostHighlightPlatform;
  targets: Array<{
    platform: PostHighlightPlatform;
    captionAngle: string;
    coverNote?: string;
    postOrder: number;
  }>;
  groupId: string;
};

export type PostAutopsy = {
  postId: string;
  title: string;
  platform: PostHighlightPlatform;
  verdict: "flop" | "underperformer";
  reasons: string[];
  fixes: string[];
};

export type PublishPrediction = {
  postTitle: string;
  platform: PostHighlightPlatform;
  viewsLow: number;
  viewsHigh: number;
  tooltracePotential: "low" | "medium" | "high";
  igUnless: string | null;
  confidence: number;
};

export type PublishKitStep = {
  platform: PostHighlightPlatform;
  order: number;
  caption: string;
  utmUrl: string;
  notes: string;
};

export type PublishKit = {
  title: string;
  steps: PublishKitStep[];
  threadMode: boolean;
  postOrderSummary: string;
};

export type ExecutivePrescription = {
  doFirst: string;
  ignore: string;
  betOfWeek: string;
};

export type PlaybookEntry = {
  id: string;
  type: "hook" | "experiment" | "validated" | "hypothesis";
  title: string;
  body: string;
  platform?: string;
  status: "validated" | "hypothesis" | "retired";
  evidenceWeeks: string[];
  liftPct?: number;
};

export type WeeklyIntelligence = {
  version: number;
  contentPnl: ContentPnl;
  funnelStory: FunnelStory;
  boardNarrative: string;
  prescription: ExecutivePrescription;
  warRoom: WarRoomAlert | null;
  competitivePulse: CompetitivePulse;
  mondayQueue: MondayQueueItem[];
  hookLibrary: HookEntry[];
  clipAttribution: ClipAttribution[];
  repurposePlans: RepurposePlan[];
  autopsies: PostAutopsy[];
  publishPredictions: PublishPrediction[];
  playbook: PlaybookEntry[];
  generatedAt: string;
};

export type IntelligenceInput = {
  weekStart: string;
  report: import("@/lib/db").WeeklyReport | null;
  previousReport: import("@/lib/db").WeeklyReport | null;
  history: import("@/lib/db").WeeklyReport[];
  channels: import("@/lib/db").Channel[];
  context: import("@/lib/period-context").DashboardPeriodContext;
  posts: PostHighlight[];
};
