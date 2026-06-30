import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { getGeminiApiKey, getGeminiModel } from "@/lib/gemini/config";
import { FINALREV_SOUL, TOOLTRACE_SOUL, type CaptionBrand } from "@/lib/pr-toolkit/voice-guides";
import { shortsAnalysisSchema } from "@/lib/shorts/schemas";
import type { TranscriptCue } from "@/lib/shorts/types";
import { cuesToPlainTranscript, parseBracketTranscript } from "@/lib/shorts/srt-cues";
import { SHORTS_MAX_DURATION_SEC } from "@/lib/shorts/types";

const MAX_INLINE_BYTES = 20 * 1024 * 1024;

export async function transcribeWithTimestamps(
  buffer: Buffer,
  mimeType: string,
): Promise<TranscriptCue[]> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error("Gemini not configured");

  if (buffer.byteLength > MAX_INLINE_BYTES) {
    throw new Error("Audio too large for inline transcription (max 20 MB)");
  }

  const model = getGeminiModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: buffer.toString("base64"),
              },
            },
            {
              text: `Transcribe all spoken words with precise timestamps.
Format each line exactly as: [MM:SS.ss] spoken text
Use decimal seconds in brackets. One line per phrase or sentence.
Plain transcript only. No speaker labels or commentary.`,
            },
          ],
        },
      ],
      generationConfig: { temperature: 0.15 },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Timestamp transcription failed (${response.status}): ${errText.slice(0, 180)}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error("No timestamped transcript returned");

  const cues = parseBracketTranscript(text);
  if (cues.length === 0) {
    throw new Error("Could not parse timestamps. Upload a .srt from Descript.");
  }
  return cues;
}

export async function analyzeShortsClips(input: {
  brand: CaptionBrand;
  cues: TranscriptCue[];
  durationSec: number;
  videoNotes?: string;
  weekContext?: string;
}): Promise<{
  clips: Array<{
    startSec: number;
    endSec: number;
    hook: string;
    overlayText: string;
    transcript: string;
    viralScore: number;
    vibe: string;
    editStyle: "punch_zoom" | "hard_cut" | "smooth_hold";
    why: string;
    youtubeTitle: string;
    youtubeDescription: string;
    hashtags: string[];
  }>;
  audience?: string;
  contentSummary?: string;
}> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error("Gemini not configured");

  const soul = input.brand === "tooltrace" ? TOOLTRACE_SOUL : FINALREV_SOUL;
  const transcriptBlock = input.cues
    .map((c) => `[${formatSec(c.startSec)}] ${c.text}`)
    .join("\n");

  const google = createGoogleGenerativeAI({ apiKey });
  const { object } = await generateObject({
    model: google(getGeminiModel()),
    schema: shortsAnalysisSchema,
    system: `You are a YouTube Shorts editor for manufacturing and CNC brands.
${soul}

Find 3-6 clips of at most ${SHORTS_MAX_DURATION_SEC} seconds each from the footage.

Rules:
- Each clip MUST be ≤${SHORTS_MAX_DURATION_SEC} seconds (endSec - startSec ≤ ${SHORTS_MAX_DURATION_SEC})
- Hook in the first 1.5 seconds: clear payoff, contrarian claim, or process reveal
- overlayText: 3-6 words, readable on mobile
- Prefer complete thoughts; do not cut mid-sentence
- viralScore: 0-100 based on hook clarity, shareability, and audience fit (not guaranteed performance)
- editStyle: punch_zoom for high-energy; hard_cut for hot takes; smooth_hold for process shots
- youtubeTitle: specific, under 70 characters
- hashtags: mix niche (#CNC #machinist) and broad (#manufacturing)
- Clips should not overlap heavily`,
    prompt: [
      `Source duration: ${input.durationSec.toFixed(1)}s`,
      input.videoNotes?.trim() ? `Editor notes: ${input.videoNotes.trim()}` : "",
      input.weekContext?.trim() ? `Period context:\n${input.weekContext.trim()}` : "",
      "## Timestamped transcript",
      transcriptBlock,
      "",
      "Return clip candidates with exact startSec/endSec from the transcript.",
    ]
      .filter(Boolean)
      .join("\n"),
    temperature: 0.65,
    maxRetries: 2,
  });

  const validated = object.clips
    .map((clip) => clampClip(clip, input.durationSec))
    .filter((c) => c.durationSec > 2 && c.durationSec <= SHORTS_MAX_DURATION_SEC)
    .sort((a, b) => b.viralScore - a.viralScore);

  if (validated.length === 0) {
    throw new Error("No valid clips found. Try longer footage or clearer audio.");
  }

  return { clips: validated, audience: object.audience, contentSummary: object.contentSummary };
}

function formatSec(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${s.toFixed(2).padStart(5, "0")}`;
}

function clampClip(
  clip: {
    startSec: number;
    endSec: number;
    hook: string;
    overlayText: string;
    transcript: string;
    viralScore: number;
    vibe: string;
    editStyle: "punch_zoom" | "hard_cut" | "smooth_hold";
    why: string;
    youtubeTitle: string;
    youtubeDescription: string;
    hashtags: string[];
  },
  maxDuration: number,
) {
  const startSec = Math.max(0, clip.startSec);
  let endSec = Math.min(maxDuration, clip.endSec);
  if (endSec - startSec > SHORTS_MAX_DURATION_SEC) {
    endSec = startSec + SHORTS_MAX_DURATION_SEC;
  }
  return {
    ...clip,
    startSec,
    endSec,
    durationSec: endSec - startSec,
  };
}

export { cuesToPlainTranscript };
