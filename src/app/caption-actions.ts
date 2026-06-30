"use server";

import { revalidatePath } from "next/cache";
import {
  generateVideoCaptions,
  type GeneratedPlatformCaptions,
} from "@/lib/gemini/caption-generator";
import { buildCaptionWeekContext } from "@/lib/gemini/caption-prompt";
import { isGeminiConfigured } from "@/lib/gemini/config";
import type { ContentArchetype } from "@/lib/pr-toolkit/market-intelligence";
import type { CaptionBrand, CaptionPlatform } from "@/lib/pr-toolkit/voice-guides";
import { getDashboardData, getWeeklyReport, updateCaptionStudio } from "@/lib/db";
import { buildDashboardPeriodContext } from "@/lib/period-context";
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
    return {
      ok: false,
      error: "Add GOOGLE_GENERATIVE_AI_API_KEY (or GEMINI_API_KEY) to .env.local to enable Caption Studio.",
    };
  }

  let weekContext: string | undefined;
  if (input.useWeekContext) {
    const { report, channels } = await getDashboardData(input.weekStart);
    const context = buildDashboardPeriodContext(input.weekStart, report);
    weekContext = buildCaptionWeekContext(report, channels, context).summary;
  }

  try {
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
