import {
  getAppPort,
  getConfiguredPublicUrl,
  getLanIpAddress,
  getBonjourBaseUrl,
  type ShareUrlInfo,
} from "@/lib/network-url";

/** LAN team URL — not deployed publicly; use Bonjour/IP from the host Mac */
export const PRODUCTION_TEAM_URL = "http://localhost:8787";

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/$/, "");
}

/** Resolve what to show in the header: pinned link > env > live Mac/LAN URL */
export function resolveTeamShareUrl(storedUrl: string | null): ShareUrlInfo {
  const pinned = storedUrl?.trim() || getConfiguredPublicUrl();
  if (pinned) {
    return {
      url: normalizeBaseUrl(pinned),
      source: "pinned",
      label: "Team link",
    };
  }

  const port = getAppPort();
  const bonjour = getBonjourBaseUrl(port);
  if (bonjour) {
    return {
      url: bonjour,
      source: "live",
      label: "This Mac",
    };
  }

  const ip = getLanIpAddress();
  if (ip) {
    return {
      url: `http://${ip}:${port}`,
      source: "live",
      label: "This device",
    };
  }

  return { url: null, source: null, label: "Share link" };
}

/** Best URL to pre-fill when pinning (Bonjour survives DHCP better than raw IP) */
export function getSuggestedPinUrl(): string | null {
  const port = getAppPort();
  return getBonjourBaseUrl(port) ?? resolveTeamShareUrl(null).url;
}

export function isValidTeamUrl(raw: string): boolean {
  try {
    const url = new URL(raw.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
