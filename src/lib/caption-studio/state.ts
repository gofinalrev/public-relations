import type { CaptionBrand, CaptionPlatform } from "@/lib/pr-toolkit/voice-guides";

export type CaptionPick = {
  platform: CaptionPlatform;
  optionIndex: number;
  text: string;
  brand: CaptionBrand;
  pickedAt: string;
};

export type CaptionStudioState = {
  picks: CaptionPick[];
  posted: CaptionPlatform[];
};

export const EMPTY_CAPTION_STUDIO_STATE: CaptionStudioState = {
  picks: [],
  posted: [],
};

export function parseCaptionStudioState(raw: string | null | undefined): CaptionStudioState {
  if (!raw?.trim()) return { ...EMPTY_CAPTION_STUDIO_STATE };
  try {
    const parsed = JSON.parse(raw) as Partial<CaptionStudioState>;
    return {
      picks: Array.isArray(parsed.picks) ? parsed.picks : [],
      posted: Array.isArray(parsed.posted) ? parsed.posted : [],
    };
  } catch {
    return { ...EMPTY_CAPTION_STUDIO_STATE };
  }
}

export function getPickForPlatform(
  state: CaptionStudioState,
  platform: CaptionPlatform,
): CaptionPick | undefined {
  return state.picks.find((p) => p.platform === platform);
}

export function isPlatformPosted(state: CaptionStudioState, platform: CaptionPlatform): boolean {
  return state.posted.includes(platform);
}
