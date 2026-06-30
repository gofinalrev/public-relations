import { NextRequest, NextResponse } from "next/server";
import { renderShortFromSession, renderShortFromUpload } from "@/lib/shorts/render-short";
import type { ShortsEditStyle } from "@/lib/shorts/types";
import { sanitizeExecutiveError } from "@/lib/ops-log";
import { isFfmpegAvailable } from "@/lib/video/ffmpeg";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function POST(request: NextRequest) {
  if (!isFfmpegAvailable()) {
    return NextResponse.json(
      { ok: false, error: "Export unavailable. Run the app on the local server." },
      { status: 503 },
    );
  }

  try {
    const formData = await request.formData();
    const sessionId = (formData.get("sessionId") as string | null)?.trim() || undefined;
    const file = formData.get("video") as File | null;
    const startSec = Number(formData.get("startSec"));
    const durationSec = Number(formData.get("durationSec"));
    const editStyle = (formData.get("editStyle") as ShortsEditStyle) || "hard_cut";
    const overlayText = (formData.get("overlayText") as string | null) ?? "";
    const burnCaption = formData.get("burnCaption") !== "false";
    const speedBoost = formData.get("speedBoost") === "true";

    if (!Number.isFinite(startSec) || !Number.isFinite(durationSec) || durationSec <= 0) {
      return NextResponse.json({ ok: false, error: "Invalid clip timing" }, { status: 400 });
    }

    const result =
      sessionId && !file
        ? await renderShortFromSession({
            sessionId,
            startSec,
            durationSec,
            editStyle,
            overlayText,
            options: { burnCaption, speedBoost },
          })
        : file
          ? await renderShortFromUpload({
              file,
              startSec,
              durationSec,
              editStyle,
              overlayText,
              options: { burnCaption, speedBoost },
            })
          : null;

    if (!result) {
      return NextResponse.json(
        { ok: false, error: "Session expired. Re-analyze your footage." },
        { status: 400 },
      );
    }

    return new NextResponse(new Uint8Array(result.buffer), {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(result.buffer.length),
        "Content-Disposition": `attachment; filename="${result.fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Render failed";
    return NextResponse.json(
      { ok: false, error: sanitizeExecutiveError(message, "Export failed") },
      { status: 500 },
    );
  }
}
