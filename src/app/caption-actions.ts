"use server";

import { revalidatePath } from "next/cache";
import {
  generateVideoCaptions,
  type GeneratedPlatformCaptions,
} from "@/lib/gemini/caption-generator";
import { buildCaptionWeekContext } from "@/lib/gemini/caption-prompt";
import { isGeminiConfigured } from "@/lib/gemini/config";
import { logOps } from "@/lib/ops-log";
import type { ContentArchetype } from "@/lib/pr-toolkit/market-intelligence";
import { getDefaultVoiceGuide, type CaptionBrand, type CaptionPlatform } from "@/lib/pr-toolkit/voice-guides";
import { getDashboardData, getWeeklyReport, updateCaptionStudio } from "@/lib/db";
import { buildDashboardPeriodContext } from "@/lib/period-context";
import { getResolvedSoul, resetSoulOverride, saveSoulOverride } from "@/lib/pr-toolkit/soul-settings";
import {
  type CaptionPick,
  type CaptionStudioState,
  parseCaptionStudioState,
} from "@/lib/caption-studio/state";

export type GenerateCaptionsInput = {
  brand: CaptionBrand;
  platforms: CaptionPlatform[];
  transcript: string;
  videoNotes?: string;
  weekStart: string;
  useWeekContext?: boolean;
  appendUtm?: boolean;
  xThreadMode?: boolean;
  contentArchetype?: ContentArchetype;
};

export type GenerateCaptionsResult =
  | {
      ok: true;
      captions: GeneratedPlatformCaptions[];
      detectedArchetype?: string;
      audience?: string;
    }
  | { ok: false; error: string };

async function persistCaptionState(weekStart: string, state: CaptionStudioState) {
  await updateCaptionStudio(weekStart, JSON.stringify(state));
  revalidatePath("/");
  revalidatePath(`/?week=${weekStart}`);
}

export async function generateCaptionsAction(
  input: GenerateCaptionsInput,
): Promise<GenerateCaptionsResult> {
  if (!isGeminiConfigured()) {
    logOps("Caption Studio needs GOOGLE_GENERATIVE_AI_API_KEY (or GEMINI_API_KEY) in .env.local.");
    return {
      ok: false,
      error: "Caption Studio is not available yet.",
    };
  }

  let weekContext: string | undefined;
  if (input.useWeekContext) {
    const { report, channels } = await getDashboardData(input.weekStart);
    const context = buildDashboardPeriodContext(input.weekStart, report);
    weekContext = buildCaptionWeekContext(report, channels, context).summary;
  }

  try {
    const voiceGuide = await getResolvedSoul(input.brand);
    const result = await generateVideoCaptions({
      brand: input.brand,
      platforms: input.platforms,
      transcript: input.transcript,
      videoNotes: input.videoNotes,
      weekStart: input.weekStart,
      appendUtm: input.appendUtm,
      weekContext,
      xThreadMode: input.xThreadMode,
      contentArchetype: input.contentArchetype ?? "auto",
      voiceGuide,
    });
    return {
      ok: true,
      captions: result.captions,
      detectedArchetype: result.detectedArchetype,
      audience: result.audience,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Caption generation failed",
    };
  }
}

export async function saveCaptionPickAction(
  weekStart: string,
  pick: CaptionPick,
): Promise<{ ok: true; state: CaptionStudioState } | { ok: false; error: string }> {
  const report = await getWeeklyReport(weekStart);
  const state = parseCaptionStudioState(report?.caption_studio_json);
  const picks = state.picks.filter((p) => p.platform !== pick.platform);
  picks.push(pick);
  const next: CaptionStudioState = { ...state, picks };
  await persistCaptionState(weekStart, next);
  return { ok: true, state: next };
}

export async function toggleCaptionPostedAction(
  weekStart: string,
  platform: CaptionPlatform,
  posted: boolean,
): Promise<{ ok: true; state: CaptionStudioState }> {
  const report = await getWeeklyReport(weekStart);
  const state = parseCaptionStudioState(report?.caption_studio_json);
  const postedSet = new Set(state.posted);
  if (posted) postedSet.add(platform);
  else postedSet.delete(platform);
  const next: CaptionStudioState = { ...state, posted: [...postedSet] };
  await persistCaptionState(weekStart, next);
  return { ok: true, state: next };
}

export async function saveSoulAction(
  brand: CaptionBrand,
  text: string,
): Promise<{ ok: true; override: string | null } | { ok: false; error: string }> {
  try {
    await saveSoulOverride(brand, text);
    revalidatePath("/");
    const trimmed = text.trim();
    const override = trimmed && trimmed !== getDefaultVoiceGuide(brand) ? trimmed : null;
    return { ok: true, override };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not save soul.md" };
  }
}

export async function resetSoulAction(
  brand: CaptionBrand,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await resetSoulOverride(brand);
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not reset soul.md" };
  }
}
