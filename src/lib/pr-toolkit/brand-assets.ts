import { PRODUCT_URLS } from "@/lib/product-labels";

export type BrandAsset = {
  id: string;
  brand: "finalrev" | "tooltrace";
  name: string;
  path: string;
  usage: string;
  variant: "dark" | "light" | "both";
};

export const BRAND_ASSETS: BrandAsset[] = [
  {
    id: "finalrev-logo-dark",
    brand: "finalrev",
    name: "Logo (dark bg)",
    path: "/brand/finalrev/logo-dark.svg",
    usage: "Light logo on dark posts, Reels end cards",
    variant: "dark",
  },
  {
    id: "finalrev-logo-light",
    brand: "finalrev",
    name: "Logo (light bg)",
    path: "/brand/finalrev/logo-light.svg",
    usage: "Dark logo on light posts, LinkedIn banners",
    variant: "light",
  },
  {
    id: "finalrev-wordmark-dark",
    brand: "finalrev",
    name: "Wordmark + logo (dark bg)",
    path: "/brand/finalrev/wordmark-with-logo-dark.svg",
    usage: "Full lockup for video outros, shop-floor content",
    variant: "dark",
  },
  {
    id: "finalrev-wordmark-light",
    brand: "finalrev",
    name: "Wordmark + logo (light bg)",
    path: "/brand/finalrev/wordmark-with-logo-light.svg",
    usage: "Full lockup on white/light carousel slides",
    variant: "light",
  },
  {
    id: "tooltrace-logo-dark",
    brand: "tooltrace",
    name: "Logo (dark bg)",
    path: "/brand/tooltrace/logo-dark.svg",
    usage: "Tooltrace watermark on dark CAD demo clips",
    variant: "dark",
  },
  {
    id: "tooltrace-logo-light",
    brand: "tooltrace",
    name: "Logo (light bg)",
    path: "/brand/tooltrace/logo-light.svg",
    usage: "Tooltrace on light tutorial thumbnails",
    variant: "light",
  },
  {
    id: "tooltrace-wordmark-dark",
    brand: "tooltrace",
    name: "Wordmark + logo (dark bg)",
    path: "/brand/tooltrace/wordmark-with-logo-dark.svg",
    usage: "Primary Tooltrace branding on Shorts/Reels",
    variant: "dark",
  },
  {
    id: "tooltrace-wordmark-light",
    brand: "tooltrace",
    name: "Wordmark + logo (light bg)",
    path: "/brand/tooltrace/wordmark-with-logo-light.svg",
    usage: "Carousel covers, IG story stickers",
    variant: "light",
  },
  {
    id: "tooltrace-by-finalrev-dark",
    brand: "tooltrace",
    name: "By finalREV (dark bg)",
    path: "/brand/tooltrace/by-finalrev-dark.svg",
    usage: "Co-brand when linking both products in one post",
    variant: "dark",
  },
  {
    id: "tooltrace-by-finalrev-light",
    brand: "tooltrace",
    name: "By finalREV (light bg)",
    path: "/brand/tooltrace/by-finalrev-light.svg",
    usage: "Co-brand on light backgrounds",
    variant: "light",
  },
];

/** Marketing screenshots hosted on production sites (paths from tooltrace + finalrev frontends) */
export type MarketingMediaItem = {
  id: string;
  brand: "finalrev" | "tooltrace";
  label: string;
  url: string;
  note: string;
  category: "hero" | "product" | "shop-floor" | "tutorial" | "examples" | "team" | "equipment";
};

export const MARKETING_MEDIA: MarketingMediaItem[] = [
  // —— Tooltrace ——
  {
    id: "tooltrace-hero-compare-before",
    brand: "tooltrace",
    label: "Before trace (hero)",
    url: "https://www.tooltrace.ai/images/home/hero-compare-before-light.png",
    note: "Pair with after shot for carousel or split-screen Reels",
    category: "hero",
  },
  {
    id: "tooltrace-hero-compare",
    brand: "tooltrace",
    label: "After trace (hero)",
    url: "https://www.tooltrace.ai/images/home/hero-compare-after-light.png",
    note: "Split-screen before/after — core product demo",
    category: "hero",
  },
  {
    id: "tooltrace-try-me",
    brand: "tooltrace",
    label: "Try me hero",
    url: "https://www.tooltrace.ai/images/home/hero-try-me-light.png",
    note: "CTA graphic for “upload a photo” posts",
    category: "hero",
  },
  {
    id: "tooltrace-step-1",
    brand: "tooltrace",
    label: "How it works · step 1",
    url: "https://www.tooltrace.ai/images/home/step-1.png",
    note: "Photo step — carousel slide 1 of 3",
    category: "product",
  },
  {
    id: "tooltrace-step-2",
    brand: "tooltrace",
    label: "How it works · step 2",
    url: "https://www.tooltrace.ai/images/home/step-2.png",
    note: "Trace step — carousel slide 2 of 3",
    category: "product",
  },
  {
    id: "tooltrace-step-3",
    brand: "tooltrace",
    label: "How it works · step 3",
    url: "https://www.tooltrace.ai/images/home/step-3.png",
    note: "Export step — carousel slide 3 of 3",
    category: "product",
  },
  {
    id: "tooltrace-gridfinity",
    brand: "tooltrace",
    label: "Gridfinity mode",
    url: "https://www.tooltrace.ai/images/home/gridfinity.jpeg",
    note: "Gridfinity insert output — maker audience",
    category: "product",
  },
  {
    id: "tooltrace-community-design",
    brand: "tooltrace",
    label: "Community design example",
    url: "https://www.tooltrace.ai/images/home/community-designs/design-01.png",
    note: "Community library posts — download without tracing",
    category: "examples",
  },
  {
    id: "tooltrace-example-upload",
    brand: "tooltrace",
    label: "Example tool photo",
    url: "https://www.tooltrace.ai/images/examples/example-1.jpeg",
    note: "Sample upload for tutorial / “try this photo” posts",
    category: "examples",
  },
  {
    id: "tooltrace-og",
    brand: "tooltrace",
    label: "App preview (OG)",
    url: "https://www.tooltrace.ai/images/og.png",
    note: "Designer UI screenshot — link previews and static posts",
    category: "product",
  },
  {
    id: "tooltrace-5s",
    brand: "tooltrace",
    label: "5S hero",
    url: "https://www.tooltrace.ai/images/5s/hero-5s.jpeg",
    note: "Shop-floor org angle — ties Tooltrace to 5S content",
    category: "shop-floor",
  },
  {
    id: "tooltrace-5s-before-after",
    brand: "tooltrace",
    label: "5S before/after drawer",
    url: "https://www.tooltrace.ai/images/5s/before-after.jpeg",
    note: "Chaotic drawer vs organized foam — strong Reels hook",
    category: "shop-floor",
  },
  {
    id: "tooltrace-5s-process",
    brand: "tooltrace",
    label: "5S · photo → trace → export",
    url: "https://www.tooltrace.ai/images/5s/process-steps.png",
    note: "Three-step process graphic for 5S landing posts",
    category: "shop-floor",
  },
  {
    id: "tooltrace-5s-floor",
    brand: "tooltrace",
    label: "Manufacturing floor stations",
    url: "https://www.tooltrace.ai/images/5s/manufacturing-floor.jpeg",
    note: "Multi-workstation 5S — enterprise angle",
    category: "shop-floor",
  },
  {
    id: "tooltrace-5s-audit",
    brand: "tooltrace",
    label: "5S audit compliance",
    url: "https://www.tooltrace.ai/images/5s/audit-compliance.jpeg",
    note: "Audit-ready tool storage — LinkedIn procurement angle",
    category: "shop-floor",
  },
  {
    id: "tooltrace-how-to-og",
    brand: "tooltrace",
    label: "How-to guide cover",
    url: "https://www.tooltrace.ai/images/how-to/og-how-to.png",
    note: "Share when linking tooltrace.ai/how-to",
    category: "tutorial",
  },
  {
    id: "tooltrace-parallax-workflow",
    brand: "tooltrace",
    label: "Parallax size-check workflow",
    url: "https://www.tooltrace.ai/images/how-to/parallax-workflow.jpeg",
    note: "Accuracy / size-check education posts",
    category: "tutorial",
  },
  {
    id: "tooltrace-team",
    brand: "tooltrace",
    label: "Team photo",
    url: "https://www.tooltrace.ai/images/about/team.jpeg",
    note: "About / founder story posts",
    category: "team",
  },

  // —— finalREV ——
  {
    id: "finalrev-og",
    brand: "finalrev",
    label: "Site preview (OG)",
    url: "https://www.finalrev.com/images/og.png",
    note: "Homepage share image — quote flow CTA posts",
    category: "hero",
  },
  {
    id: "finalrev-hero-try-me",
    brand: "finalrev",
    label: "Upload STEP hero",
    url: "https://www.finalrev.com/images/home/hero-try-me-light.avif",
    note: "Quote upload CTA — pair with finalrev.com/quote",
    category: "hero",
  },
  {
    id: "finalrev-hero-compare-after",
    brand: "finalrev",
    label: "Quote UI (after)",
    url: "https://www.finalrev.com/images/home/hero-compare-after-light.avif",
    note: "Software-first quoting — product demo still",
    category: "product",
  },
  {
    id: "finalrev-pricing-example",
    brand: "finalrev",
    label: "Pricing example (medium part)",
    url: "https://www.finalrev.com/images/home/pricing-md-light.avif",
    note: "Transparent pricing carousel — medium complexity part",
    category: "product",
  },
  {
    id: "finalrev-specialty-gears",
    brand: "finalrev",
    label: "Precision gears specialty",
    url: "https://www.finalrev.com/images/home/home-gears.avif",
    note: "Capabilities / specialty machining posts",
    category: "equipment",
  },
  {
    id: "finalrev-specialty-carbon",
    brand: "finalrev",
    label: "Carbon fiber machining",
    url: "https://www.finalrev.com/images/home/home-carbon-fiber.avif",
    note: "Exotic materials angle — aerospace / robotics",
    category: "equipment",
  },
  {
    id: "finalrev-machine-408mt",
    brand: "finalrev",
    label: "Willemin 408MT mill-turn",
    url: "https://www.finalrev.com/images/equipment/408mt.png",
    note: "Mill-turn capability posts — complex parts in one setup",
    category: "equipment",
  },
  {
    id: "finalrev-machine-umc500",
    brand: "finalrev",
    label: "Haas UMC-500SS 5-axis",
    url: "https://www.finalrev.com/images/equipment/umc-500ss.png",
    note: "5-axis shop-floor content — process porn hooks",
    category: "equipment",
  },
  {
    id: "finalrev-part-example",
    brand: "finalrev",
    label: "Finished part example",
    url: "https://www.finalrev.com/images/examples/example1.jpeg",
    note: "Customer part beauty shot — pair with process video",
    category: "examples",
  },
  {
    id: "finalrev-bay-area",
    brand: "finalrev",
    label: "Bay Area map",
    url: "https://www.finalrev.com/images/bay-area.png",
    note: "Local pickup / Berkeley shop — SF Bay audience",
    category: "team",
  },
  {
    id: "finalrev-founders",
    brand: "finalrev",
    label: "Founders photo",
    url: "https://www.finalrev.com/images/mission/founders.png",
    note: "Mission / about posts — LinkedIn founder story",
    category: "team",
  },
  {
    id: "finalrev-mission-vision",
    brand: "finalrev",
    label: "Mission vision graphic",
    url: "https://www.finalrev.com/images/mission/vision.png",
    note: "Software-first shop narrative",
    category: "team",
  },
  {
    id: "finalrev-app-tooltrace",
    brand: "finalrev",
    label: "Tooltrace app tile",
    url: "https://www.finalrev.com/images/apps/tooltrace.png",
    note: "Co-brand posts linking Tooltrace from finalREV",
    category: "product",
  },
];

export const KEY_URLS = [
  { label: "Tooltrace designer (main CTA)", url: PRODUCT_URLS.tooltrace.designer, product: "tooltrace" as const },
  { label: "Tooltrace home", url: PRODUCT_URLS.tooltrace.home, product: "tooltrace" as const },
  { label: "Tooltrace community", url: PRODUCT_URLS.tooltrace.community, product: "tooltrace" as const },
  { label: "How-to guide", url: PRODUCT_URLS.tooltrace.howTo, product: "tooltrace" as const },
  { label: "5S landing", url: PRODUCT_URLS.tooltrace.fiveS, product: "tooltrace" as const },
  { label: "Tooltrace pricing / Pro", url: PRODUCT_URLS.tooltrace.pricing, product: "tooltrace" as const },
  { label: "finalREV home", url: PRODUCT_URLS.finalrev.home, product: "finalrev" as const },
  { label: "Get a CNC quote", url: PRODUCT_URLS.finalrev.quote, product: "finalrev" as const },
  { label: "Capabilities", url: PRODUCT_URLS.finalrev.capabilities, product: "finalrev" as const },
];

/** Which product each @gofinalrev channel should link to in bios */
export const CHANNEL_BIO_PRODUCT: Record<string, "tooltrace" | "finalrev"> = {
  youtube: "tooltrace",
  x: "tooltrace",
  instagram: "tooltrace",
  linkedin: "finalrev",
  tiktok: "tooltrace",
  facebook: "finalrev",
  reddit: "tooltrace",
};
