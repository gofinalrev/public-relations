import { Resend } from "resend";
import { getAppSetting, setAppSetting } from "@/lib/db";
import type { WeeklyBriefAnalysis } from "@/lib/email/weekly-brief-analysis";
import { getWeeklyBriefRecipients, isWeeklyBriefEmailConfigured } from "@/lib/email/recipients";

const FROM = process.env.WEEKLY_BRIEF_FROM?.trim() || "finalREV PR <notifications@gofinalrev.com>";
const SENT_KEY_PREFIX = "weekly_brief_sent_";

export type SendWeeklyBriefResult =
  | { ok: true; messageId?: string; skipped?: false }
  | { ok: true; skipped: true; reason: string }
  | { ok: false; error: string };

export async function sendWeeklyBriefEmail(
  weekStart: string,
  analysis: WeeklyBriefAnalysis,
  options?: { force?: boolean },
): Promise<SendWeeklyBriefResult> {
  if (!isWeeklyBriefEmailConfigured()) {
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const sentKey = `${SENT_KEY_PREFIX}${weekStart}`;
  if (!options?.force) {
    const already = await getAppSetting(sentKey);
    if (already) {
      return { ok: true, skipped: true, reason: `Brief already sent for ${weekStart}` };
    }
  }

  const { to, cc } = getWeeklyBriefRecipients();
  const resend = new Resend(process.env.RESEND_API_KEY!.trim());

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      cc,
      subject: analysis.subject,
      html: analysis.html,
      text: analysis.plainText,
      replyTo: "support@finalrev.com",
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    await setAppSetting(sentKey, new Date().toISOString());
    return { ok: true, messageId: data?.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Email send failed",
    };
  }
}
