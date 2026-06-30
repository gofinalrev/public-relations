import type { SocialPlatformSlug } from "@/lib/platforms";
import { PRODUCT_URLS } from "@/lib/product-labels";

export type CopyBlock = {
  id: string;
  platform?: SocialPlatformSlug | "all";
  product: "tooltrace" | "finalrev" | "both";
  label: string;
  text: string;
  maxChars?: number;
};

export const PRODUCT_ONE_LINERS = {
  tooltrace:
    "Snap a photo of your tools → AI traces outlines → download STL, 3MF, STEP, DXF, or SVG for Gridfinity bins and shadowbox foam.",
  finalrev:
    "Upload a STEP file for instant CNC quotes — mill-turn, 5-axis, laser, and waterjet from a modern machine shop.",
  both: "finalREV builds parts. Tooltrace organizes your tools. Same team — maker to pro shop pipeline.",
};

export const COPY_BLOCKS: CopyBlock[] = [
  {
    id: "tooltrace-bio-short",
    platform: "all",
    product: "tooltrace",
    label: "Tooltrace · short bio",
    text: "AI tool organizers for Gridfinity & shadowbox foam. Photo → trace → print. Free at tooltrace.ai/designer",
    maxChars: 160,
  },
  {
    id: "tooltrace-bio-ig",
    platform: "instagram",
    product: "tooltrace",
    label: "Instagram bio line",
    text: "Custom foam inserts from a photo 📸 Free designer ↓ tooltrace.ai/designer",
    maxChars: 150,
  },
  {
    id: "tooltrace-bio-tiktok",
    platform: "tiktok",
    product: "tooltrace",
    label: "TikTok bio line",
    text: "Photo → tool foam in 5 min. Free ↓",
    maxChars: 80,
  },
  {
    id: "tooltrace-youtube-desc",
    platform: "youtube",
    product: "tooltrace",
    label: "YouTube description opener",
    text: "Design custom tool foam in minutes — upload a photo, trace your tools, export for 3D print or laser cut. Try free: tooltrace.ai/designer",
  },
  {
    id: "finalrev-linkedin",
    platform: "linkedin",
    product: "finalrev",
    label: "LinkedIn company blurb",
    text: "finalREV is a modern CNC job shop — instant quotes from STEP uploads, Datron & mill-turn capability, and shop-floor tooling built in-house with Tooltrace.",
  },
  {
    id: "finalrev-linkedin-short",
    platform: "linkedin",
    product: "finalrev",
    label: "LinkedIn · short tagline",
    text: "Upload STEP. Get a quote. We machine it. finalrev.com/quote",
    maxChars: 120,
  },
  {
    id: "x-hook-cad",
    platform: "x",
    product: "tooltrace",
    label: "X hook · Tooltrace demo",
    text: "Stop tracing tools by hand. One photo → printable insert in under 5 minutes. tooltrace.ai/designer",
  },
  {
    id: "x-hook-shop",
    platform: "x",
    product: "finalrev",
    label: "X hook · shop floor",
    text: "Upload STEP. Get a quote. We machine it. finalrev.com/quote",
  },
  {
    id: "reddit-tooltrace",
    platform: "reddit",
    product: "tooltrace",
    label: "Reddit post tone",
    text: "Built a free tool to turn a photo of your wrenches/drivers into Gridfinity or foam inserts — no CAD skills needed. Would love feedback from this community.",
  },
  {
    id: "cta-tooltrace",
    platform: "all",
    product: "tooltrace",
    label: "Tooltrace CTA",
    text: `Try it free → ${PRODUCT_URLS.tooltrace.designer}`,
  },
  {
    id: "cta-finalrev",
    platform: "all",
    product: "finalrev",
    label: "finalREV quote CTA",
    text: `Upload your STEP for an instant quote → ${PRODUCT_URLS.finalrev.quote}`,
  },
  {
    id: "cta-both",
    platform: "all",
    product: "both",
    label: "Both products · end card",
    text: "Organize tools → tooltrace.ai/designer · Get parts cut → finalrev.com/quote",
  },
];

export const CONTENT_PILLARS = [
  {
    id: "product-demo",
    title: "Product demo",
    product: "tooltrace" as const,
    formats: ["Short vertical", "Screen recording", "Before/after"],
    idea: "Photo upload → auto trace → 3MF download. Show the full loop in <60s.",
    bestOn: ["youtube", "x", "tiktok", "instagram"],
  },
  {
    id: "shop-floor",
    title: "Shop floor / finalREV",
    product: "finalrev" as const,
    formats: ["Reel", "Carousel", "LinkedIn video"],
    idea: "Datron fly-cut, tool setup, or quote-to-chip story — tie to real parts.",
    bestOn: ["linkedin", "instagram", "youtube"],
  },
  {
    id: "cad-vs-ai",
    title: "CAD vs AI split",
    product: "both" as const,
    formats: ["Split screen", "Side-by-side"],
    idea: "Manual CAD trace vs Tooltrace — strong on X and YouTube for Tooltrace conversion.",
    bestOn: ["x", "youtube"],
  },
  {
    id: "community",
    title: "Community listing",
    product: "tooltrace" as const,
    formats: ["Carousel", "Screenshot"],
    idea: "Highlight a popular community insert — download without tracing.",
    bestOn: ["reddit", "instagram", "x"],
  },
  {
    id: "5s-org",
    title: "5S / organization",
    product: "tooltrace" as const,
    formats: ["Static", "Time-lapse"],
    idea: "Messy drawer → organized foam — appeals to makers and shops.",
    bestOn: ["linkedin", "tiktok", "instagram"],
  },
  {
    id: "quote-story",
    title: "Quote-to-chip",
    product: "finalrev" as const,
    formats: ["Carousel", "Short video"],
    idea: "STEP upload → instant quote → machined part — B2B conversion on LinkedIn.",
    bestOn: ["linkedin", "youtube"],
  },
];
