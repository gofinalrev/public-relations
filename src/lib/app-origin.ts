const PR_HUB_DEFAULT = "https://pr.finalrev.com";

function normalizeOrigin(value: string | undefined): string | undefined {
  const trimmed = value?.trim().replace(/\/$/, "");
  return trimmed || undefined;
}

export function isPrHubOrigin(origin: string): boolean {
  try {
    const host = new URL(origin).hostname.toLowerCase();
    if (host === "pr.finalrev.com") return true;
    if (host === "localhost" || host === "127.0.0.1") return true;
    if (host.endsWith(".vercel.app")) return true;
    return false;
  } catch {
    return false;
  }
}

export function appOrigin(requestOrigin?: string): string {
  const req = normalizeOrigin(requestOrigin);
  if (req && isPrHubOrigin(req)) return req;

  const env = normalizeOrigin(process.env.APP_PUBLIC_URL);
  if (env && isPrHubOrigin(env)) return env;

  return req || env || PR_HUB_DEFAULT;
}
