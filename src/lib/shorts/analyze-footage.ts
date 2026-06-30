import "server-only";

import { randomUUID } from "crypto";
import { mkdir, writeFile, unlink, readFile } from "fs/promises";
import path from "path";
import os from "os";
import type { ShortsAnalysis, ShortsBrand, ShortClipCandidate } from "@/lib/shorts/types";
import { parseSrtCues } from "@/lib/shorts/srt-cues";
import { analyzeShortsClips, transcribeWithTimestamps } from "@/lib/gemini/shorts-analyzer";
import {
  extractAudioMp3,
  isFfmpegAvailable,
  probeVideo,
} from "@/lib/video/ffmpeg";
import { resolveTranscribeMimeType } from "@/lib/gemini/transcribe";
import type { CaptionBrand } from "@/lib/pr-toolkit/voice-guides";

const SESSION_TTL_MS = 45 * 60 * 1000;

type StoredSession = {
  videoPath: string;
  dir: string;
  expiresAt: number;
};

const sessions = new Map<string, StoredSession>();

function pruneSessions() {
  const now = Date.now();
  for (const [id, s] of sessions) {
    if (s.expiresAt < now) {
      sessions.delete(id);
      unlink(s.videoPath).catch(() => undefined);
    }
  }
}

export async function analyzeFootage(input: {
  file: File;
  brand: ShortsBrand;
  videoNotes?: string;
  weekContext?: string;
  srtText?: string;
}): Promise<ShortsAnalysis> {
  pruneSessions();

  const buffer = Buffer.from(await input.file.arrayBuffer());
  const sessionId = randomUUID();
  const dir = await mkdir(path.join(os.tmpdir(), "shorts", sessionId), { recursive: true }).then(
    () => path.join(os.tmpdir(), "shorts", sessionId),
  );
  const ext = path.extname(input.file.name) || ".mp4";
  const videoPath = path.join(dir, `source${ext}`);
  await writeFile(videoPath, buffer);

  let durationSec = 0;
  let width: number | undefined;
  let height: number | undefined;

  if (isFfmpegAvailable()) {
    const probe = await probeVideo(videoPath);
    durationSec = probe.durationSec;
    width = probe.width;
    height = probe.height;
  }

  let cues =
    input.srtText?.trim() ? parseSrtCues(input.srtText) : [];

  if (cues.length === 0) {
    if (!isFfmpegAvailable()) {
      throw new Error("ffmpeg required for audio extraction — run locally with npm run team:serve");
    }
    const audioPath = path.join(dir, "audio.mp3");
    await extractAudioMp3(videoPath, audioPath);
    const audioBuf = await readFile(audioPath);
    cues = await transcribeWithTimestamps(audioBuf, "audio/mpeg");
    if (durationSec <= 0 && cues.length > 0) {
      durationSec = cues[cues.length - 1].endSec + 2;
    }
  } else if (durationSec <= 0 && cues.length > 0) {
    durationSec = cues[cues.length - 1].endSec + 1;
  }

  const analysis = await analyzeShortsClips({
    brand: input.brand as CaptionBrand,
    cues,
    durationSec,
    videoNotes: input.videoNotes,
    weekContext: input.weekContext,
  });

  const clips: ShortClipCandidate[] = analysis.clips.map((c, i) => ({
    id: `clip-${i + 1}`,
    ...c,
    durationSec: c.endSec - c.startSec,
  }));

  sessions.set(sessionId, {
    videoPath,
    dir,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });

  return {
    sessionId,
    sourceFileName: input.file.name,
    durationSec,
    width,
    height,
    brand: input.brand,
    cues,
    clips,
    generatedAt: new Date().toISOString(),
  };
}

export function resolveSessionVideoPath(sessionId: string): string | null {
  pruneSessions();
  return sessions.get(sessionId)?.videoPath ?? null;
}

export function isVideoFile(file: { type: string; name: string }): boolean {
  const mime = resolveTranscribeMimeType(file);
  return Boolean(mime?.startsWith("video/"));
}
