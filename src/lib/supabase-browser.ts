import { createBrowserClient } from "@supabase/ssr";
import { supabaseConfig } from "@/lib/auth";
import { supabaseCookieOptions } from "@/lib/supabase-session";

export function createSupabaseBrowserClient() {
  const cfg = supabaseConfig();
  if (!cfg) throw new Error("Supabase not configured");
  return createBrowserClient(cfg.url, cfg.key, {
    cookieOptions: supabaseCookieOptions(),
  });
}
