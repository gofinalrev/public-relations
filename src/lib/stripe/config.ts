import { readFileSync, existsSync } from "fs";
import path from "path";

export const STRIPE_CONFIG = {
  secretKey: process.env.STRIPE_SECRET_KEY ?? "",
  proPriceId: process.env.STRIPE_PRO_PRICE_ID ?? "",
  /** Match Tooltrace webhook metadata.environment (usually "production") */
  environment: process.env.STRIPE_ENV_NAME ?? process.env.ENV_NAME ?? "production",
};

function parseEnvValue(line: string, key: string): string | null {
  if (!line.startsWith(`${key}=`)) return null;
  let value = line.slice(key.length + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  return value || null;
}

/** Optional: read Stripe keys from Tooltrace frontend env when not set here */
function hydrateFromTooltraceEnv(): { secretKey?: string; proPriceId?: string; environment?: string } {
  const candidates = [
    process.env.TOOLTRACE_ENV_FILE,
    path.join(process.cwd(), "../tooltrace/frontend/.env.local"),
    path.join(process.cwd(), "../tooltrace/frontend/.env.production.local"),
  ].filter(Boolean) as string[];

  const out: { secretKey?: string; proPriceId?: string; environment?: string } = {};

  for (const filePath of candidates) {
    if (!existsSync(filePath)) continue;
    try {
      const lines = readFileSync(filePath, "utf8").split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        out.secretKey ??= parseEnvValue(trimmed, "STRIPE_SECRET_KEY") ?? undefined;
        out.proPriceId ??= parseEnvValue(trimmed, "STRIPE_PRO_PRICE_ID") ?? undefined;
        out.environment ??= parseEnvValue(trimmed, "ENV_NAME") ?? undefined;
      }
    } catch {
      /* ignore unreadable env files */
    }
    if (out.secretKey && out.proPriceId) break;
  }

  return out;
}

const tooltraceEnv = hydrateFromTooltraceEnv();

export function getStripeSecretKey(): string {
  return STRIPE_CONFIG.secretKey || tooltraceEnv.secretKey || "";
}

export function getStripeProPriceId(): string {
  return STRIPE_CONFIG.proPriceId || tooltraceEnv.proPriceId || "";
}

export function getStripeEnvironment(): string {
  return STRIPE_CONFIG.environment || tooltraceEnv.environment || "production";
}

export function isStripeConfigured(): boolean {
  return Boolean(getStripeSecretKey() && getStripeProPriceId());
}

export function stripeConfigSource(): "social_hq_env" | "tooltrace_env" | "missing" {
  if (STRIPE_CONFIG.secretKey && STRIPE_CONFIG.proPriceId) return "social_hq_env";
  if (tooltraceEnv.secretKey && tooltraceEnv.proPriceId) return "tooltrace_env";
  return "missing";
}
