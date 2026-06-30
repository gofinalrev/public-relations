import { NextRequest, NextResponse } from "next/server";
import { getLinkPreview } from "link-preview-js";

export const runtime = "nodejs";

const ALLOWED_HOSTS = new Set([
  "finalrev.com",
  "www.finalrev.com",
  "tooltrace.ai",
  "www.tooltrace.ai",
]);

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url");
  if (!raw) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return NextResponse.json({ error: "Invalid protocol" }, { status: 400 });
  }

  const host = parsed.hostname.replace(/^www\./, "");
  const allowed = [...ALLOWED_HOSTS].some(
    (h) => parsed.hostname === h || parsed.hostname === `www.${h}` || host === h.replace(/^www\./, ""),
  );
  if (!allowed) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  try {
    const preview = await getLinkPreview(parsed.href, {
      followRedirects: "follow",
      timeout: 8000,
    });

    return NextResponse.json({
      url: parsed.href,
      title: "title" in preview ? preview.title : null,
      description: "description" in preview ? preview.description : null,
      image: "images" in preview && preview.images?.[0] ? preview.images[0] : null,
      siteName: "siteName" in preview ? preview.siteName : null,
    });
  } catch {
    return NextResponse.json({ error: "Preview failed" }, { status: 502 });
  }
}
