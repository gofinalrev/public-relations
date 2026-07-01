import type { User } from "@supabase/supabase-js";
import { isAllowedEmail } from "@/lib/auth/allowed-email";

/** Same gate as finalrev /api/admin — JWT app_metadata from Supabase Auth. */
export function isShopAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.app_metadata?.user_role === "shop_admin";
}

export function hasPrHubAccess(user: User | null | undefined): boolean {
  return isAllowedEmail(user?.email) && isShopAdmin(user);
}
