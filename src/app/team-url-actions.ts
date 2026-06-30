"use server";

import { revalidatePath } from "next/cache";
import { setAppSetting } from "@/lib/db";
import { isValidTeamUrl } from "@/lib/team-url";

export async function saveTeamPublicUrl(url: string): Promise<{ ok: boolean; error?: string }> {
  const trimmed = url.trim();
  if (!trimmed) {
    await setAppSetting("team_public_url", "");
    revalidatePath("/");
    return { ok: true };
  }

  if (!isValidTeamUrl(trimmed)) {
    return { ok: false, error: "Use a full http:// or https:// URL" };
  }

  await setAppSetting("team_public_url", trimmed.replace(/\/$/, ""));
  revalidatePath("/");
  return { ok: true };
}
