import { ensureDbReady, getDbClient } from "@/lib/db";

export async function getAuthDb() {
  await ensureDbReady();
  return getDbClient();
}
