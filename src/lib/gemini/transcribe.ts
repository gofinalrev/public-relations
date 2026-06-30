import { getGeminiApiKey, getGeminiModel } from "@/lib/gemini/config";

const MAX_BYTES = 20 * 1024 * 1024;

const ALLOWED_MIME: Record<string, string> = {
  "audio/mpeg": "audio/mpeg",
  "audio/mp3": "audio/mpeg",
  "audio/mp4": "audio/mp4",
  "audio/x-m4a": "audio/mp4",
  "audio/m4a": "audio/mp4",
  "audio/wav": "audio/wav",
  "audio/webm": "audio/webm",
  "video/mp4": "video/mp4",
  "video/quicktime": "video/quicktime",
  "video/webm": "video/webm",
};

export function resolveTranscribeMimeType(file: { type: string; name: string }): string | null {
  if (file.type && ALLOWED_MIME[file.type]) return ALLOWED_MIME[file.type];
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".mp3")) return "audio/mpeg";
  if (lower.endsWith(".m4a")) return "audio/mp4";
  if (lower.endsWith(".wav")) return "audio/wav";
  if (lower.endsWith(".webm")) return "audio/webm";
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".mov")) return "video/quicktime";
  return null;
}

export async function transcribeMediaBuffer(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Gemini not configured");
  }

  if (buffer.byteLength > MAX_BYTES) {
    throw new Error("File too large (max 20 MB). Export audio from Descript or paste a .srt/.txt transcript.");
  }

  const model = getGeminiModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: buffer.toString("base64"),
              },
            },
            {
              text: "Transcribe all spoken words verbatim. Plain text only. No timestamps, labels, or speaker tags.",
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Transcription failed (${response.status}): ${errText.slice(0, 180)}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) {
    throw new Error("No transcript returned. Try a shorter clip or paste .srt/.txt.");
  }

  return text;
}
