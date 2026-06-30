import "server-only";

import { randomUUID } from "crypto";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import os from "os";
import type { ShortsEditStyle, ShortsRenderOptions } from "@/lib/shorts/types";
import {
  isFfmpegAvailable,
  readOutputAndCleanup,
  renderShortClip,
  writeAssFile,
} from "@/lib/video/ffmpeg";
import { resolveSessionVideoPath } from "@/lib/shorts/analyze-footage";

export async function renderShortFromSession(input: {
  sessionId: string;
  startSec: number;
  durationSec: number;
  editStyle: ShortsEditStyle;
  overlayText: string;
  options: ShortsRenderOptions;
}): Promise<{ buffer: Buffer; fileName: string }> {
  if (!isFfmpegAvailable()) {
    throw new Error("Video export needs ffmpeg — run the app locally (npm run team:serve)");
  }

  const sourcePath = resolveSessionVideoPath(input.sessionId);
  if (!sourcePath) {
    throw new Error("Session expired — re-analyze your footage");
  }

  const dir = path.join(os.tmpdir(), "shorts", `render-${randomUUID()}`);
  await mkdir(dir, { recursive: true });
  const outputPath = path.join(dir, "short.mp4");

  let assPath: string | undefined;
  if (input.options.burnCaption && input.overlayText.trim()) {
    assPath = await writeAssFile(dir, input.overlayText);
  }

  try {
    await renderShortClip({
      inputPath: sourcePath,
      outputPath,
      startSec: input.startSec,
      durationSec: input.durationSec,
      editStyle: input.editStyle,
      assPath,
      speedBoost: input.options.speedBoost,
    });
    const buffer = await readOutputAndCleanup(outputPath, assPath ?? "");
    return { buffer, fileName: `short-${Math.round(input.startSec)}s.mp4` };
  } catch (err) {
    await unlink(outputPath).catch(() => undefined);
    if (assPath) await unlink(assPath).catch(() => undefined);
    throw err;
  }
}

/** Render when client re-uploads source (session-less fallback). */
export async function renderShortFromUpload(input: {
  file: File;
  startSec: number;
  durationSec: number;
  editStyle: ShortsEditStyle;
  overlayText: string;
  options: ShortsRenderOptions;
}): Promise<{ buffer: Buffer; fileName: string }> {
  if (!isFfmpegAvailable()) {
    throw new Error("Video export needs ffmpeg — run the app locally (npm run team:serve)");
  }

  const dir = path.join(os.tmpdir(), "shorts", `upload-${randomUUID()}`);
  await mkdir(dir, { recursive: true });
  const ext = path.extname(input.file.name) || ".mp4";
  const sourcePath = path.join(dir, `source${ext}`);
  const outputPath = path.join(dir, "short.mp4");
  const buffer = Buffer.from(await input.file.arrayBuffer());
  await writeFile(sourcePath, buffer);

  let assPath: string | undefined;
  if (input.options.burnCaption && input.overlayText.trim()) {
    assPath = await writeAssFile(dir, input.overlayText);
  }

  try {
    await renderShortClip({
      inputPath: sourcePath,
      outputPath,
      startSec: input.startSec,
      durationSec: input.durationSec,
      editStyle: input.editStyle,
      assPath,
      speedBoost: input.options.speedBoost,
    });
    const out = await readOutputAndCleanup(outputPath, sourcePath, assPath ?? "");
    return { buffer: out, fileName: `short-${Math.round(input.startSec)}s.mp4` };
  } catch (err) {
    await unlink(sourcePath).catch(() => undefined);
    await unlink(outputPath).catch(() => undefined);
    if (assPath) await unlink(assPath).catch(() => undefined);
    throw err;
  }
}
