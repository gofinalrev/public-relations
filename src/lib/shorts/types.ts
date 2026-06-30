export type ShortsBrand = "finalrev" | "tooltrace";

export type ShortsEditStyle = "punch_zoom" | "hard_cut" | "smooth_hold";

export type TranscriptCue = {
  startSec: number;
  endSec: number;
  text: string;
};

export type ShortClipCandidate = {
  id: string;
  startSec: number;
  endSec: number;
  durationSec: number;
  hook: string;
  overlayText: string;
  transcript: string;
  viralScore: number;
  vibe: string;
  editStyle: ShortsEditStyle;
  why: string;
  youtubeTitle: string;
  youtubeDescription: string;
  hashtags: string[];
};

export type ShortsAnalysis = {
  sessionId: string;
  sourceFileName: string;
  durationSec: number;
  width?: number;
  height?: number;
  brand: ShortsBrand;
  cues: TranscriptCue[];
  clips: ShortClipCandidate[];
  generatedAt: string;
};

export type ShortsRenderOptions = {
  burnCaption: boolean;
  speedBoost: boolean;
};

export const SHORTS_MAX_DURATION_SEC = 10;
export const SHORTS_MAX_UPLOAD_BYTES = 120 * 1024 * 1024;
