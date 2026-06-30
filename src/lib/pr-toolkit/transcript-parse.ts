/** Strip SRT timing/index lines and join cue text */
export function parseSrtContent(raw: string): string {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const textLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^\d+$/.test(trimmed)) continue;
    if (/^\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->/.test(trimmed)) continue;
    textLines.push(trimmed);
  }

  return textLines.join(" ").replace(/\s+/g, " ").trim();
}

export function parseTranscriptFile(name: string, content: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".srt")) {
    return parseSrtContent(content);
  }
  return content.replace(/\r\n/g, "\n").trim();
}

export const TRANSCRIPT_ACCEPT = ".txt,.srt,text/plain,application/x-subrip";
