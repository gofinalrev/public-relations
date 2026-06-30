import os from "os";

/** Pick the machine's LAN IPv4 for sharing on the same Wi‑Fi */
export function getLanIpAddress(): string | null {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const entries = interfaces[name];
    if (!entries) continue;
    for (const entry of entries) {
      if (entry.family === "IPv4" && !entry.internal) {
        return entry.address;
      }
    }
  }
  return null;
}

export function getAppPort(): number {
  return Number(process.env.PORT ?? process.env.NEXT_PUBLIC_APP_PORT ?? 8787);
}

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/$/, "");
}

/** Optional override from .env */
export function getConfiguredPublicUrl(): string | null {
  const raw = process.env.APP_PUBLIC_URL?.trim();
  if (!raw) return null;
  return normalizeBaseUrl(raw);
}

/** macOS Bonjour name — stable on the same Wi‑Fi even when the IP changes */
export function getBonjourHostname(): string | null {
  const raw = os.hostname();
  if (!raw || raw === "localhost") return null;
  const base = raw.replace(/\.local$/i, "");
  if (!base) return null;
  return `${base}.local`;
}

export function getBonjourBaseUrl(port: number): string | null {
  const host = getBonjourHostname();
  if (!host) return null;
  return `http://${host}:${port}`;
}

export type ShareUrlSource = "pinned" | "live";

export type ShareUrlInfo = {
  url: string | null;
  source: ShareUrlSource | null;
  label: string;
};
