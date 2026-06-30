"use server";

import { revalidatePath } from "next/cache";
import { syncFreeChannelStats } from "@/lib/social/sync";

export async function syncSocialChannels() {
  try {
    const result = await syncFreeChannelStats();
    revalidatePath("/");
    return { ok: true as const, result };
  } catch {
    return { ok: false as const };
  }
}
