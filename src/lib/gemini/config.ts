import { readFileSync, existsSync } from "fs";
import path from "path";

function parseEnvValue(line: string, key: string): string | null {
  if (!line.startsWith(`${key}=`)) return null;
  let value = line.slice(key.length + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  return value || null;
}

function hydrateFromSiblingEnv(candidates: string[]): { apiKey?: string; model?: string } {
  const out: { apiKey?: string; model?: string } = {};

  for (const filePath of candidates) {
    if (!existsSync(filePath)) continue;
    try {
      const lines = readFileSync(filePath, "utf8").split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        out.apiKey ??=
          parseEnvValue(trimmed, "GOOGLE_GENERATIVE_AI_API_KEY") ??
          parseEnvValue(trimmed, "GEMINI_API_KEY") ??
          undefined;
        out.model ??= parseEnvValue(trimmed, "GEMINI_MODEL") ?? undefined;
      }
    } catch {
      /* ignore unreadable env files */
    }
    if (out.apiKey) break;
  }

  return out;
}

const finalrevEnv = hydrateFromSiblingEnv([
  process.env.FINALREV_ENV_FILE,
  path.join(process.cwd(), "../finalrev/frontend/.env.local"),
  path.join(process.cwd(), "../finalrev/frontend/.env.production.local"),
].filter(Boolean) as string[]);

export function getGeminiApiKey(): string | null {
  return (
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    process.env.GEMINI_API_KEY?.trim() ||
    finalrevEnv.apiKey?.trim() ||
    null
  );
}

export function isGeminiConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}

export function getGeminiModel(): string {
  return (
    process.env.GEMINI_MODEL?.trim() ||
    finalrevEnv.model?.trim() ||
    "gemini-2.0-flash"
  );
}

export function geminiConfigSource(): "social_hq_env" | "finalrev_env" | "missing" {
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim()) {
    return "social_hq_env";
  }
  if (finalrevEnv.apiKey) return "finalrev_env";
  return "missing";
}
