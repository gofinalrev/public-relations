import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isAllowedEmail } from "@/lib/auth/allowed-email";

let adminClient: SupabaseClient | null = null;

function getAdminClient(): SupabaseClient | null {
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !key) return null;

  adminClient = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return adminClient;
}

export async function verifyShopAdminByEmail(email: string | null | undefined): Promise<boolean> {
  if (!isAllowedEmail(email)) return false;

  const admin = getAdminClient();
  if (!admin) return false;

  const { data: row } = await admin
    .from("users")
    .select("role")
    .eq("email", email!.toLowerCase())
    .maybeSingle();

  return row?.role === "shop_admin";
}
