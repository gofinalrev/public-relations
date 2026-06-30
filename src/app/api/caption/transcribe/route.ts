import { NextRequest, NextResponse } from "next/server";
import { isGeminiConfigured } from "@/lib/gemini/config";
import { resolveTranscribeMimeType, transcribeMediaBuffer } from "@/lib/gemini/transcribe";
import { logOps, sanitizeExecutiveError } from "@/lib/ops-log";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  if (!isGeminiConfigured()) {
    logOps("Transcription needs GOOGLE_GENERATIVE_AI_API_KEY in .env.local.");
    return NextResponse.json(
      { ok: false, error: "Transcription is not available yet." },
      { status: 503 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("media") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
    }

    const mimeType = resolveTranscribeMimeType(file);
    if (!mimeType) {
      return NextResponse.json(
        {
          ok: false,
          error: "Use mp3, m4a, wav, mp4, or mov. For long edits, export .srt from Descript instead.",
        },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const transcript = await transcribeMediaBuffer(buffer, mimeType);

    return NextResponse.json({ ok: true, transcript });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transcription failed";
    return NextResponse.json(
      { ok: false, error: sanitizeExecutiveError(message, "Transcription failed") },
      { status: 500 },
    );
  }
}
