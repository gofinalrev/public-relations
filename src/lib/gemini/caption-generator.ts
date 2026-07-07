import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { buildUtmUrl } from "@/lib/utm";
import { PRODUCT_URLS } from "@/lib/product-labels";
import { getGeminiApiKey, getGeminiModel } from "@/lib/gemini/config";
import type { CaptionOptionMeta } from "@/lib/gemini/caption-schemas";
import { captionResponseSchema } from "@/lib/gemini/caption-schemas";
import {
  buildCaptionSystemPrompt,
  buildCaptionUserPrompt,
} from "@/lib/gemini/caption-prompt";
import { xFitsLimit } from "@/lib/social/x-text";
import type { ContentArchetype } from "@/lib/pr-toolkit/market-intelligence";
import type { CaptionBrand, CaptionPlatform } from "@/lib/pr-toolkit/voice-guides";

export type GeneratedPlatformCaptions = {
  platform: CaptionPlatform;
  options: [string, string, string, string];
  optionMeta: [CaptionOptionMeta, CaptionOptionMeta, CaptionOptionMeta, CaptionOptionMeta];
};

export type CaptionGenerationResult = {
  captions: GeneratedPlatformCaptions[];
  detectedArchetype?: string;
  audience?: string;
};

export type CaptionGenerationInput = {
  brand: CaptionBrand;
  platforms: CaptionPlatform[];
  transcript: string;
  videoNotes?: string;
  weekContext?: string;
  weekStart?: string;
  appendUtm?: boolean;
  xThreadMode?: boolean;
  contentArchetype?: ContentArchetype;
  voiceGuide: string;
};

const CLICHE_PATTERN =
  /\b(excited to (announce|share)|game[- ]changer|revolutioniz(e|ing)|we're thrilled|proud to announce)\b/gi;

function ctaForBrand(brand: CaptionBrand): string {
  return brand === "finalrev" ? PRODUCT_URLS.finalrev.quote : PRODUCT_URLS.tooltrace.designer;
}

function utmForPlatform(brand: CaptionBrand, platform: CaptionPlatform, weekStart?: string): string {
  const base = brand === "finalrev" ? "finalrev" : "tooltrace";
  const medium = platform === "youtube" || platform === "tiktok" ? "video" : "social";
  const campaign = weekStart ?? `caption-${new Date().toISOString().slice(0, 10)}`;
  return buildUtmUrl(base, platform, medium, campaign, "caption-studio");
}

function sanitizeCaption(text: string, platform: CaptionPlatform): string {
  let out = text
    .replace(/\u2014/g, "-")
    .replace(/\u2013/g, "-")
    .replace(/—/g, "-")
    .replace(CLICHE_PATTERN, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (platform === "instagram" || platform === "tiktok") {
    const tags = out.match(/#\w+/g) ?? [];
    if (tags.length > 6) {
      const keep = new Set(tags.slice(0, 6));
      out = out.replace(/#\w+/g, (tag) => (keep.has(tag) ? tag : ""));
      out = out.replace(/\s{2,}/g, " ").trim();
    }
  }

  return out;
}

function normalizeOptions(
  raw: Array<{ text: string; style: string; hookType: string }>,
  platform: CaptionPlatform,
): {
  options: [string, string, string, string];
  optionMeta: [CaptionOptionMeta, CaptionOptionMeta, CaptionOptionMeta, CaptionOptionMeta];
} {
  const cleaned = raw.map((row) => ({
    text: sanitizeCaption(row.text, platform),
    style: row.style.trim() || "general",
    hookType: row.hookType.trim() || "hook",
  }));

  while (cleaned.length < 4) {
    const last = cleaned[cleaned.length - 1] ?? { text: "", style: "general", hookType: "hook" };
    cleaned.push({ ...last });
  }

  const slice = cleaned.slice(0, 4);
  return {
    options: slice.map((o) => o.text) as [string, string, string, string],
    optionMeta: slice.map(({ style, hookType, text }) => ({ text, style, hookType })) as [
      CaptionOptionMeta,
      CaptionOptionMeta,
      CaptionOptionMeta,
      CaptionOptionMeta,
    ],
  };
}

function maybeAppendUtm(
  caption: string,
  brand: CaptionBrand,
  platform: CaptionPlatform,
  weekStart?: string,
): string {
  const url = utmForPlatform(brand, platform, weekStart);
  if (caption.includes(url) || caption.includes(url.replace("https://www.", "https://"))) {
    return caption;
  }
  if (platform === "youtube") {
    return `${caption}\n\n${url}`;
  }
  if (platform === "x") {
    const candidate = `${caption} ${url}`;
    if (!xFitsLimit(candidate)) return caption;
    return candidate;
  }
  return `${caption} ${url}`;
}

export async function generateVideoCaptions(
  input: CaptionGenerationInput,
): Promise<CaptionGenerationResult> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Gemini not configured — add GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY to .env.local");
  }

  if (!input.transcript.trim()) {
    throw new Error("Paste a transcript first");
  }

  if (input.platforms.length === 0) {
    throw new Error("Pick at least one platform");
  }

  const archetype = input.contentArchetype ?? "auto";
  const google = createGoogleGenerativeAI({ apiKey });
  const { object } = await generateObject({
    model: google(getGeminiModel()),
    schema: captionResponseSchema,
    system: buildCaptionSystemPrompt({
      brand: input.brand,
      platforms: input.platforms,
      archetype,
      xThreadMode: Boolean(input.xThreadMode),
      voiceGuide: input.voiceGuide,
    }),
    prompt: buildCaptionUserPrompt({
      brand: input.brand,
      transcript: input.transcript,
      videoNotes: input.videoNotes,
      weekContext: input.weekContext,
      archetype,
      ctaUrl: ctaForBrand(input.brand),
    }),
    temperature: 0.75,
    maxRetries: 2,
  });

  const byPlatform = new Map<CaptionPlatform, GeneratedPlatformCaptions>();

  for (const row of object.captions) {
    const platform = row.platform;
    if (!input.platforms.includes(platform)) continue;

    const { options, optionMeta } = normalizeOptions(row.options, platform);
    let finalOptions = options;
    if (input.appendUtm) {
      finalOptions = options.map((opt) =>
        maybeAppendUtm(opt, input.brand, platform, input.weekStart),
      ) as [string, string, string, string];
    }

    byPlatform.set(platform, {
      platform,
      options: finalOptions,
      optionMeta: finalOptions.map((text, i) => ({ ...optionMeta[i], text })) as [
        CaptionOptionMeta,
        CaptionOptionMeta,
        CaptionOptionMeta,
        CaptionOptionMeta,
      ],
    });
  }

  const captions = input.platforms
    .map((p) => byPlatform.get(p))
    .filter((c): c is GeneratedPlatformCaptions => Boolean(c));

  if (captions.length === 0) {
    throw new Error("No captions returned for the selected platforms — try again");
  }

  return {
    captions,
    detectedArchetype: object.detectedArchetype,
    audience: object.audience,
  };
}
