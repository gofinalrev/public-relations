import { NextRequest, NextResponse } from "next/server";
import { isGeminiConfigured } from "@/lib/gemini/config";
import { analyzeFootage, isVideoFile } from "@/lib/shorts/analyze-footage";
import type { ShortsBrand } from "@/lib/shorts/types";
import { SHORTS_MAX_UPLOAD_BYTES } from "@/lib/shorts/types";
import { logOps, sanitizeExecutiveError } from "@/lib/ops-log";
import { isFfmpegAvailable } from "@/lib/video/ffmpeg";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  if (!isGeminiConfigured()) {
    logOps("Shorts editor needs GOOGLE_GENERATIVE_AI_API_KEY in .env.local.");
    return NextResponse.json(
      { ok: false, error: "Shorts editor is not available yet." },
      { status: 503 },
    );
  }

  if (!isFfmpegAvailable()) {
    logOps("Shorts editor needs ffmpeg — install via npm (ffmpeg-static) and run locally.");
  }

  try {
    const formData = await request.formData();
    const file = formData.get("video") as File | null;
    const brand = (formData.get("brand") as ShortsBrand | null) ?? "finalrev";
    const videoNotes = (formData.get("videoNotes") as string | null)?.trim() || undefined;
    const weekContext = (formData.get("weekContext") as string | null)?.trim() || undefined;
    const srtText = (formData.get("srt") as string | null)?.trim() || undefined;

    if (!file || file.size === 0) {
      return NextResponse.json({ ok: false, error: "Upload video footage first" }, { status: 400 });
    }

    if (file.size > SHORTS_MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { ok: false, error: `Video too large (max ${Math.round(SHORTS_MAX_UPLOAD_BYTES / 1024 / 1024)} MB)` },
        { status: 400 },
      );
    }

    if (!isVideoFile(file)) {
      return NextResponse.json(
        { ok: false, error: "Use mp4, mov, or webm shop-floor footage" },
        { status: 400 },
      );
    }

    const analysis = await analyzeFootage({
      file,
      brand: brand === "tooltrace" ? "tooltrace" : "finalrev",
      videoNotes,
      weekContext,
      srtText,
    });

    return NextResponse.json({
      ok: true,
      analysis,
      ffmpegReady: isFfmpegAvailable(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json(
      { ok: false, error: sanitizeExecutiveError(message, "Shorts analysis failed") },
      { status: 500 },
    );
  }
}
