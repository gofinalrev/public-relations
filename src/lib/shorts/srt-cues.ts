import type { TranscriptCue } from "./types";

function parseSrtTimestamp(ts: string): number {
  const normalized = ts.trim().replace(",", ".");
  const [h, m, rest] = normalized.split(":");
  const [s, ms = "0"] = rest.split(".");
  return (
    Number(h) * 3600 +
    Number(m) * 60 +
    Number(s) +
    Number(ms.padEnd(3, "0").slice(0, 3)) / 1000
  );
}

/** Parse SRT into timed cues (Descript / Premiere export). */
export function parseSrtCues(raw: string): TranscriptCue[] {
  const blocks = raw.replace(/\r\n/g, "\n").trim().split(/\n\n+/);
  const cues: TranscriptCue[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    const timingLine = lines.find((l) => l.includes("-->"));
    if (!timingLine) continue;

    const [startRaw, endRaw] = timingLine.split("-->").map((s) => s.trim());
    const text = lines
      .filter((l) => l !== timingLine && !/^\d+$/.test(l))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) continue;

    cues.push({
      startSec: parseSrtTimestamp(startRaw),
      endSec: parseSrtTimestamp(endRaw),
      text,
    });
  }

  return cues;
}

/** Parse Gemini bracket timestamps: [MM:SS.ss] text */
export function parseBracketTranscript(raw: string): TranscriptCue[] {
  const cues: TranscriptCue[] = [];
  const lineRe = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.+)/g;
  let match: RegExpExecArray | null;

  while ((match = lineRe.exec(raw)) !== null) {
    const startSec =
      Number(match[1]) * 60 +
      Number(match[2]) +
      Number((match[3] ?? "0").padEnd(3, "0").slice(0, 3)) / 1000;
    const text = match[4].trim();
    if (!text) continue;
    cues.push({ startSec, endSec: startSec, text });
  }

  for (let i = 0; i < cues.length; i++) {
    const next = cues[i + 1];
    cues[i].endSec = next ? next.startSec : cues[i].startSec + 4;
  }

  return cues;
}

export function cuesToPlainTranscript(cues: TranscriptCue[]): string {
  return cues.map((c) => c.text).join(" ").replace(/\s+/g, " ").trim();
}

export function formatAssTimestamp(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const cs = Math.floor((s % 1) * 100);
  const whole = Math.floor(s);
  return `${h}:${String(m).padStart(2, "0")}:${String(whole).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

export function buildHookAss(overlayText: string, durationSec = 2.8): string {
  const safe = overlayText.replace(/[{}\\]/g, "").slice(0, 80);
  const end = formatAssTimestamp(Math.min(durationSec, 4));
  return `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Hook,Arial Black,64,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,4,0,2,40,40,280,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,${end},Hook,,0,0,0,,${safe.toUpperCase()}`;
}
