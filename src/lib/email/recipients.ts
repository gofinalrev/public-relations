const DEFAULT_TO = ["vladimir@finalrev.com", "julian@finalrev.com"] as const;
const DEFAULT_CC = ["david@finalrev.com", "devon@finalrev.com"] as const;

function parseList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;]/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes("@"));
}

/** Weekly PR brief recipients — override with WEEKLY_BRIEF_TO / WEEKLY_BRIEF_CC env (comma-separated) */
export function getWeeklyBriefRecipients(): { to: string[]; cc: string[] } {
  const to = parseList(process.env.WEEKLY_BRIEF_TO);
  const cc = parseList(process.env.WEEKLY_BRIEF_CC);
  return {
    to: to.length > 0 ? to : [...DEFAULT_TO],
    cc: cc.length > 0 ? cc : [...DEFAULT_CC],
  };
}

export function isWeeklyBriefEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}
