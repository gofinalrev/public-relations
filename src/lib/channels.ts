import { getAllChannels } from "@/lib/db";

export async function isRedditSetupNeeded(): Promise<boolean> {
  const reddit = (await getAllChannels()).find((c) => c.slug === "reddit");
  return reddit?.status === "setup_needed";
}
