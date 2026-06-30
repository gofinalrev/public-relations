/** Canonical product URLs — use www for both brands in links and UTMs */
export const PRODUCT_URLS = {
  tooltrace: {
    home: "https://www.tooltrace.ai",
    designer: "https://www.tooltrace.ai/designer",
    community: "https://www.tooltrace.ai/community",
    howTo: "https://www.tooltrace.ai/how-to",
    fiveS: "https://www.tooltrace.ai/5s",
    pricing: "https://www.tooltrace.ai/pricing",
  },
  finalrev: {
    home: "https://www.finalrev.com",
    quote: "https://www.finalrev.com/quote",
    capabilities: "https://www.finalrev.com/capabilities",
  },
} as const;

export const PRODUCT_NAMES = {
  tooltrace: "Tooltrace",
  finalrev: "finalREV",
  social: "@gofinalrev",
} as const;

/** Short scope lines for metric cards and legends */
export const METRIC_SCOPES = {
  social: "Metricool · @gofinalrev social accounts",
  tooltraceVisitors: "PostHog · tooltrace.ai unique visitors",
  tooltraceSubs: "Stripe · new Tooltrace Pro subscriptions",
  tooltraceFunnel: "PostHog · Tooltrace product funnel",
  tooltraceReferrers: "PostHog · traffic to tooltrace.ai",
  finalrevUploads: "PostHog · finalrev.com STEP uploads (cad_upload)",
} as const;

export type ProductBrand = "tooltrace" | "finalrev" | "social" | "both";
