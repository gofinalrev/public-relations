import type { CaptionBrand, CaptionPlatform } from "@/lib/pr-toolkit/voice-guides";

/** Content archetypes used by top manufacturing / maker brands on social */
export type ContentArchetype =
  | "auto"
  | "shop_floor_asmr"
  | "dfm_lesson"
  | "cost_design_reveal"
  | "machinist_spotlight"
  | "live_process"
  | "customer_part"
  | "product_demo"
  | "before_after"
  | "5s_organization";

export const CONTENT_ARCHETYPE_LABELS: Record<ContentArchetype, string> = {
  auto: "Auto-detect from transcript",
  shop_floor_asmr: "Shop floor / CNC ASMR",
  dfm_lesson: "DFM / design lesson",
  cost_design_reveal: "Same part, smarter design",
  machinist_spotlight: "Machinist / machine spotlight",
  live_process: "Live process / transparency",
  customer_part: "Customer part story",
  product_demo: "Product demo (Tooltrace)",
  before_after: "Before / after",
  "5s_organization": "5S / shop organization",
};

export function archetypesForBrand(brand: CaptionBrand): ContentArchetype[] {
  if (brand === "finalrev") {
    return [
      "auto",
      "shop_floor_asmr",
      "dfm_lesson",
      "cost_design_reveal",
      "machinist_spotlight",
      "live_process",
      "customer_part",
    ];
  }
  return ["auto", "product_demo", "before_after", "5s_organization", "shop_floor_asmr"];
}

/** What SendCutSend, OSH Cut, Xometry, and peers do well — for prompt context, not to copy voice */
export const MARKET_LANDSCAPE = `# manufacturing social — what the market rewards (2025–2026)

## category leaders (study their structure, not their tone)
- **SendCutSend** (Reno): education-first. live streams walking through real parts, "same part smarter design" cost reveals, CAD-from-scratch series, creator collabs. proof = US facility, machinists on camera, DFM as teaching moment.
- **OSH Cut** (Utah): instant quote + DFM as hero. tutorial posts, client spotlights, meme-adjacent hooks ("10mm socket" humor) mixed with technical credibility. fiber laser, tube bending, nested pricing.
- **Xometry**: scale + distribution. CNC ASMR reposts, #tuesdaytip education, guessing games, employee/machinist features, quote flow in caption. heavy hashtag stacks on IG.
- **Protolabs / Fictiv / Hubs**: speed + materials education, engineer-facing pain points (tolerances, MOQ, lead time anxiety).

## what converts for CNC / fab buyers (engineers, founders, shop owners)
1. **Reduce perceived risk** — show the machine, the chip, the probe touch-off, the finished part in hand. not stock footage.
2. **Teach one concrete thing** — one DFM rule, one tolerance callout, one fix that saved money or time.
3. **Specificity beats adjectives** — "0.001\" on the bore" beats "precision machining."
4. **Process porn works** — fly cuts, trochoidal, 5-axis swarf, anodize rack, CMM scan. let sound and motion carry the hook.
5. **Humanize without cringe** — machinist first name, shift reality, fixturing problem solved. not corporate "our team is family."
6. **CTA matches intent** — quote/upload STEP for finalREV; try designer for Tooltrace. one clear next step.

## platform patterns that win (structure only)
- **YouTube Shorts / long**: hook in first 2 lines of description; keywords in first 100 chars; chapters/timestamps if long. shop-floor Shorts often outperform cross-posted Reels (adapt hook per platform).
- **Instagram Reels**: first line is the hook (before "more"). on-screen text friendly. 3–6 hashtags max at end, not 30.
- **LinkedIn**: one insight + one proof point + soft CTA. paragraph breaks. speak to procurement/engineering manager anxiety (lead time, revision loops, vendor trust).
- **X**: one sharp observation or number. no thread unless the transcript has 3 distinct beats. link last or in reply mindset.
- **TikTok**: conversational, "watch this cut" energy, pattern interrupt in first 5 words.

## what to avoid (category clichés)
- "instant quote" superlatives if product isn't there yet (finalREV: upload STEP for quote, not "automatic")
- "game-changer" / "revolutionizing manufacturing" / "excited to announce"
- naming competitors directly
- generic #manufacturing soup without a specific lesson
- explaining the joke after landing it`;

export function archetypeGuidance(archetype: ContentArchetype, brand: CaptionBrand): string {
  if (archetype === "auto") {
    return "Detect the best archetype from the transcript. State which archetype each of the 4 options uses in the style field.";
  }

  const guides: Record<Exclude<ContentArchetype, "auto">, string> = {
    shop_floor_asmr:
      "Archetype: shop floor ASMR (Xometry/SendCutSend style). Lead with motion, sound, or visual payoff. minimal words. let the cut speak. CTA is secondary.",
    dfm_lesson:
      "Archetype: DFM lesson (OSH Cut / SendCutSend education style). One rule the viewer can apply on their next drawing. use correct terms (radii, wall thickness, tap depth, setup count).",
    cost_design_reveal:
      "Archetype: cost/design reveal (SendCutSend live stream pattern). before/after design decision with a concrete dollar or setup-time delta if mentioned in transcript; if not, use qualitative 'fewer setups' without inventing numbers.",
    machinist_spotlight:
      "Archetype: machinist spotlight. center the person + machine + problem solved. human credibility for B2B trust.",
    live_process:
      "Archetype: live process / transparency. real floor, real chips, real queue. builds trust like SendCutSend streams.",
    customer_part:
      "Archetype: customer part story (OSH client spotlight style). what the part does, why the geometry was hard, outcome. don't invent customer names.",
    product_demo:
      "Archetype: Tooltrace product demo. photo → trace → export loop in under 5 seconds of reading.",
    before_after:
      "Archetype: before/after. messy drawer vs organized foam, manual trace vs Tooltrace, CAD hours vs minutes.",
    "5s_organization":
      "Archetype: 5S / organization. shop credibility for Tooltrace. shadowboard, missing tool visible, kaizen angle.",
  };

  const base = guides[archetype as Exclude<ContentArchetype, "auto">];
  if (brand === "tooltrace" && archetype.startsWith("shop_floor")) {
    return `${base} Tie shop organization back to Tooltrace inserts where natural.`;
  }
  return base;
}

export function platformPlaybook(platform: CaptionPlatform, brand: CaptionBrand): string {
  const cta =
    brand === "finalrev"
      ? "finalrev.com/quote (STEP upload)"
      : "tooltrace.ai/designer (free, no account required for first try)";

  switch (platform) {
    case "youtube":
      return `YouTube: Line 1–2 = search hook (what happens + machine/part type). Lines 3–5 = one DFM or process insight. Bottom: CTA ${cta}. No hashtag spam. Mention Berkeley / software-first shop only if relevant.`;
    case "instagram":
      return `Instagram Reel: Line 1 = scroll-stopper (specific image: "datron fly cut on 6061" not "amazing CNC"). Short lines. 3–6 hashtags only at end (#CNC #machinist #manufacturing max). CTA in last line or pinned comment style: ${cta}.`;
    case "linkedin":
      return `LinkedIn: Professional but not corporate. Open with business pain (revision loops, vendor trust, prototype lead time) or technical insight. One proof from video. End with ${cta}. No hashtag wall.`;
    case "x":
      return `X: One idea. Prefer a number or contrarian shop-floor observation. Under 280 weighted chars unless thread mode. ${cta} only if it fits; otherwise save link for reply.`;
    case "tiktok":
      return `TikTok: Spoken-word friendly. "watch this" / "we cut this" energy. 1–3 hashtags max. ${cta} casually at end.`;
  }
}

export function optionStyleMenu(brand: CaptionBrand): string {
  const finalrev = [
    "shop-floor hook (visual first)",
    "dfm lesson (one rule)",
    "cost/setup reveal",
    "machinist POV",
    "contrarian/process insight",
    "quiet confidence (minimal words)",
  ];
  const tooltrace = [
    "demo loop (photo → export)",
    "before/after drawer",
    "maker pain point",
    "5S / organization",
    "community listing angle",
    "Pro feature tease (honest)",
  ];
  const styles = brand === "finalrev" ? finalrev : tooltrace;
  return `Each of the 4 options MUST use a different style from this menu: ${styles.join("; ")}. Put the style name in the style field.`;
}
