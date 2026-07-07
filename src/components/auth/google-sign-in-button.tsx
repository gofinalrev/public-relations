"use client";

import { createBrowserClient } from "@supabase/ssr";
import { AUTH_RETURN_COOKIE } from "@/lib/auth";
import { PR_HUB_ORIGIN } from "@/lib/app-origin";

function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase not configured");
  return createBrowserClient(url, key);
}

/** Must match Supabase allowlist exactly — https://pr.finalrev.com */
function oauthRedirectTo(): string {
  if (typeof window !== "undefined" && window.location.hostname === "pr.finalrev.com") {
    return PR_HUB_ORIGIN;
  }
  return window.location.origin.replace(/\/$/, "");
}

type GoogleSignInButtonProps = {
  returnTo?: string;
};

export function GoogleSignInButton({ returnTo = "/" }: GoogleSignInButtonProps) {
  async function signIn() {
    document.cookie = `${AUTH_RETURN_COOKIE}=${encodeURIComponent(returnTo)}; Path=/; Max-Age=600; SameSite=Lax; Secure`;

    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: oauthRedirectTo(),
        queryParams: { hd: "finalrev.com", prompt: "select_account" },
      },
    });
    if (error) console.error(error);
  }

  return (
    <button
      type="button"
      onClick={() => void signIn()}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-foreground/15 bg-card px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/50"
    >
      Continue with Google
    </button>
  );
}
