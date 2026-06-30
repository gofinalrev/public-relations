import "server-only";

import { spawn } from "child_process";
import { readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { buildHookAss } from "@/lib/shorts/srt-cues";

export type VideoProbe = {
  durationSec: number;
  width: number;
  height: number;
};

function ffmpegBin(): string | null {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("ffmpeg-static") as string | null;
}

function ffprobeBin(): string | null {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return (require("ffprobe-static") as { path: string }).path ?? null;
}

function runCommand(
  bin: string,
  args: string[],
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d: Buffer) => {
      stdout += d.toString();
    });
    child.stderr.on("data", (d: Buffer) => {
      stderr += d.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr.slice(-500) || `Command failed (${code})`));
    });
  });
}

export function isFfmpegAvailable(): boolean {
  return Boolean(ffmpegBin() && ffprobeBin());
}

export async function probeVideo(filePath: string): Promise<VideoProbe> {
  const ffprobePath = ffprobeBin();
  if (!ffprobePath) throw new Error("ffprobe not available");
  const { stdout } = await runCommand(ffprobePath, [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=width,height",
    "-show_entries",
    "format=duration",
    "-of",
    "json",
    filePath,
  ]);
  const data = JSON.parse(stdout) as {
    streams?: Array<{ width?: number; height?: number }>;
    format?: { duration?: string };
  };
  const stream = data.streams?.[0];
  const durationSec = Number(data.format?.duration ?? 0);
  if (!stream?.width || !stream?.height || !durationSec) {
    throw new Error("Could not read video metadata");
  }
  return {
    durationSec,
    width: stream.width,
    height: stream.height,
  };
}

/** Compress to mono MP3 for Gemini transcription (smaller than full video). */
export async function extractAudioMp3(inputPath: string, outputPath: string): Promise<void> {
  const ffmpegPath = ffmpegBin();
  if (!ffmpegPath) throw new Error("ffmpeg not available");
  await runCommand(ffmpegPath, [
    "-y",
    "-i",
    inputPath,
    "-vn",
    "-acodec",
    "libmp3lame",
    "-ar",
    "16000",
    "-ac",
    "1",
    "-b:a",
    "64k",
    outputPath,
  ]);
}

export type RenderShortInput = {
  inputPath: string;
  outputPath: string;
  startSec: number;
  durationSec: number;
  editStyle: "punch_zoom" | "hard_cut" | "smooth_hold";
  assPath?: string;
  speedBoost?: boolean;
};

export async function renderShortClip(input: RenderShortInput): Promise<void> {
  const ffmpegPath = ffmpegBin();
  if (!ffmpegPath) throw new Error("ffmpeg not available");

  const crop =
    "crop=min(iw\\,ih*9/16):ih:(iw-min(iw\\,ih*9/16))/2:0," +
    "scale=1080:1920:flags=lanczos," +
    "fps=30,format=yuv420p";

  let vf = crop;
  if (input.editStyle === "punch_zoom") {
    vf =
      "crop=min(iw\\,ih*9/16):ih:(iw-min(iw\\,ih*9/16))/2:0," +
      "scale=1080:1920:flags=lanczos," +
      "zoompan=z='min(1+0.0008*on\\,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30," +
      "format=yuv420p";
  }

  if (input.assPath) {
    const escaped = input.assPath.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "'\\''");
    vf = `${vf},ass='${escaped}'`;
  }

  const args = [
    "-y",
    "-ss",
    String(input.startSec),
    "-i",
    input.inputPath,
    "-t",
    String(input.durationSec),
    "-vf",
    vf,
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "20",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-movflags",
    "+faststart",
  ];

  if (input.speedBoost || input.editStyle === "punch_zoom") {
    args.push("-af", "atempo=1.05");
  }

  args.push(input.outputPath);
  await runCommand(ffmpegPath, args);
}

export async function writeAssFile(dir: string, overlayText: string): Promise<string> {
  const assPath = path.join(dir, `hook-${Date.now()}.ass`);
  await writeFile(assPath, buildHookAss(overlayText), "utf8");
  return assPath;
}

export async function readOutputAndCleanup(outputPath: string, ...extras: string[]): Promise<Buffer> {
  try {
    return await readFile(outputPath);
  } finally {
    await Promise.all([outputPath, ...extras].map((p) => unlink(p).catch(() => undefined)));
  }
}
