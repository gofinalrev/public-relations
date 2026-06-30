import { z } from "zod";

export const shortsEditStyleSchema = z.enum(["punch_zoom", "hard_cut", "smooth_hold"]);

export const shortClipSchema = z.object({
  startSec: z.number().min(0).describe("Clip start in seconds"),
  endSec: z.number().min(0).describe("Clip end in seconds — must be ≤10s after start"),
  hook: z.string().describe("Opening hook line — what grabs attention in first 1.5s"),
  overlayText: z.string().max(60).describe("Bold on-screen text, 3-6 words, ALL CAPS vibe"),
  transcript: z.string().describe("Exact spoken words in this clip"),
  viralScore: z.number().min(0).max(100).describe("Clip quality score 0-100"),
  vibe: z.string().describe("One-word vibe e.g. reveal, fail, hot-take, satisfying"),
  editStyle: shortsEditStyleSchema,
  why: z.string().describe("One sentence why this moment wins on Shorts"),
  youtubeTitle: z.string().max(90),
  youtubeDescription: z.string().max(400),
  hashtags: z.array(z.string()).min(3).max(8),
});

export const shortsAnalysisSchema = z.object({
  clips: z.array(shortClipSchema).min(3).max(6),
  audience: z.string().optional(),
  contentSummary: z.string().optional(),
});

export type ShortsAnalysisResponse = z.infer<typeof shortsAnalysisSchema>;
