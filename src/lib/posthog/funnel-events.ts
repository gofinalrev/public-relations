/** Tooltrace designer funnel — PostHog project 167207 (tooltrace.ai) */
export const FUNNEL_EVENT_ALIASES = {
  upload: ["upload_image"],
  generate: ["generate_tool_outline", "import_tool_outlines"],
  download: ["download_cad", "community_download"],
} as const;

export type FunnelStage = keyof typeof FUNNEL_EVENT_ALIASES;

export type FunnelStageMeta = {
  stage: FunnelStage;
  events: string[];
  rawCount: number;
  displayCount: number;
  inferred: boolean;
};

export type ResolvedFunnel = {
  pageviews: number;
  upload_image: number;
  generate_tool_outline: number;
  download_cad: number;
  subscription_success: number;
  stages: FunnelStageMeta[];
  /** True when upload/generate were raised to match downloads (missing PostHog captures) */
  usedInference: boolean;
};

function sqlEventList(events: readonly string[]): string {
  return events.map((e) => `'${e}'`).join(", ");
}

export function funnelEventsSql(stage: FunnelStage): string {
  return `event IN (${sqlEventList(FUNNEL_EVENT_ALIASES[stage])})`;
}

/**
 * Optional safety net when funnel stages are under-counted (e.g. wrong PostHog project).
 * With project 167207 this should rarely apply.
 */
export function resolveCoherentFunnel(raw: {
  pageviews: number;
  upload: number;
  generate: number;
  download: number;
  subscription_success: number;
}): ResolvedFunnel {
  const download = raw.download;
  let generate = raw.generate;
  let upload = raw.upload;
  let usedInference = false;

  // Only infer when upstream stages are completely missing but downloads exist
  // (typical of querying the wrong PostHog project, e.g. FinalRev 209711 vs Tooltrace 167207).
  if (download > 0 && upload === 0 && generate === 0) {
    upload = download;
    generate = download;
    usedInference = true;
  } else if (download > 0 && generate === 0 && upload > 0) {
    generate = Math.max(upload, download);
    usedInference = true;
  } else if (generate > 0 && upload === 0) {
    upload = generate;
    usedInference = true;
  }

  const mk = (stage: FunnelStage, rawCount: number, displayCount: number): FunnelStageMeta => ({
    stage,
    events: [...FUNNEL_EVENT_ALIASES[stage]],
    rawCount,
    displayCount,
    inferred: displayCount > rawCount,
  });

  return {
    pageviews: raw.pageviews,
    upload_image: upload,
    generate_tool_outline: generate,
    download_cad: download,
    subscription_success: raw.subscription_success,
    usedInference,
    stages: [
      mk("upload", raw.upload, upload),
      mk("generate", raw.generate, generate),
      mk("download", raw.download, download),
    ],
  };
}

export function funnelStageLabel(stage: FunnelStage): string {
  const labels: Record<FunnelStage, string> = {
    upload: "Upload",
    generate: "Generate outline",
    download: "Download CAD",
  };
  return labels[stage];
}

export function describeFunnelSources(stages: FunnelStageMeta[]): string {
  return stages
    .map((s) => {
      const events = s.events.join("|");
      return `${s.stage}:${events}${s.inferred ? " (inferred≥downloads)" : ""}`;
    })
    .join("; ");
}
