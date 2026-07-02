import type { PostHighlight, PostHighlightPlatform } from "@/lib/post-highlights";

export type ContentPnl = {
  socialViews: number;
  tooltraceVisitors: number;
  proSubs: number;
  stepUploads: number;
  bestRoiClip: string | null;
  nextStep: string;
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
  /** parallel = social and site metrics shown separately (no cross-attribution) */
  mode: "parallel";
};

export type WeekPrescription = {
  doFirst: string;
  ignore: string;
  betOfWeek: string;
};

/** @deprecated use WeekPrescription */
export type ExecutivePrescription = WeekPrescription;

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
  /** How many logged posts on this platform the range is based on */
  basedOnPosts: number;
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
  prescription: WeekPrescription;
  competitivePulse: CompetitivePulse;
  mondayQueue: MondayQueueItem[];
  hookLibrary: HookEntry[];
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
