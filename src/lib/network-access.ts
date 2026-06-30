/** RFC1918, loopback, link-local — same Wi‑Fi / office LAN */
export function isPrivateOrLocalIp(raw: string): boolean {
  const ip = raw.trim().toLowerCase();
  if (!ip) return false;

  if (ip === "127.0.0.1" || ip === "::1" || ip === "localhost") return true;

  // IPv4-mapped IPv6
  const v4 = ip.startsWith("::ffff:") ? ip.slice(7) : ip;

  if (v4.startsWith("10.")) return true;
  if (v4.startsWith("192.168.")) return true;
  if (v4.startsWith("169.254.")) return true;
  if (v4.startsWith("172.")) {
    const second = Number(v4.split(".")[1]);
    if (second >= 16 && second <= 31) return true;
  }

  return false;
}

export function clientIpFromHeaders(forwardedFor: string | null, realIp: string | null): string {
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }
  return realIp?.trim() ?? "unknown";
}

export function isNetworkOnlyMode(): boolean {
  if (process.env.VERCEL === "1") return false;
  if (process.env.ALLOW_PUBLIC_ACCESS === "true") return false;
  if (process.env.NETWORK_ONLY === "false") return false;
  return true;
}

export function isVercelDeployment(): boolean {
  return Boolean(process.env.VERCEL);
}
