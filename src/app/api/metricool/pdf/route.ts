import { NextRequest, NextResponse } from "next/server";
import { importMetricoolPdfBuffer } from "@/lib/metricool/pdf-import";
import { getMetricoolPdfBuffer } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const weekStart = request.nextUrl.searchParams.get("week");
  if (!weekStart) {
    return NextResponse.json({ ok: false, error: "Missing week parameter" }, { status: 400 });
  }

  const stored = await getMetricoolPdfBuffer(weekStart);
  if (!stored || stored.data.length === 0) {
    return NextResponse.json({ ok: false, error: "No PDF on file for this week" }, { status: 404 });
  }

  const disposition = request.nextUrl.searchParams.get("disposition") === "attachment" ? "attachment" : "inline";
  const safeName = stored.meta.filename.replace(/[^\w.\-() ]+/g, "_");

  return new NextResponse(new Uint8Array(stored.data), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(stored.data.length),
      "Content-Disposition": `${disposition}; filename="${safeName}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("pdf") as File | null;
    const weekOverride = formData.get("week_start") as string | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ ok: false, error: "No PDF file provided" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ ok: false, error: "File must be a PDF" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await importMetricoolPdfBuffer(buffer, file.name, weekOverride);

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      weekStart: result.weekStart,
      periodLabel: result.periodLabel,
      filename: result.filename,
      views: result.views,
      engagement: result.engagement,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to parse PDF" },
      { status: 500 },
    );
  }
}
