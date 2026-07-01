"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { Button } from "@/components/ui/button";

type GoogleSignInProps = {
  callbackUrl: string;
  autoRedirect?: boolean;
};

export function GoogleSignIn({ callbackUrl, autoRedirect = true }: GoogleSignInProps) {
  const [loading, setLoading] = useState(false);
  const ready = isSupabaseAuthConfigured();

  async function signInWithGoogle() {
    if (!ready) return;
    setLoading(true);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(callbackUrl)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: { hd: "finalrev.com" },
      },
    });
    if (error) {
      setLoading(false);
      window.location.href = `/login?error=OAuthSignin&callbackUrl=${encodeURIComponent(callbackUrl)}`;
    }
  }

  useEffect(() => {
    if (autoRedirect && ready) {
      void signInWithGoogle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot redirect on mount
  }, [autoRedirect, ready]);

  if (!ready) {
    return (
      <div className="space-y-2 text-sm text-white/55">
        <p>Google sign-in is not configured on this server.</p>
        <p className="text-xs text-white/40">Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.</p>
      </div>
    );
  }

  return (
    <Button
      type="button"
      onClick={() => void signInWithGoogle()}
      disabled={loading}
      className="flex h-12 w-full items-center justify-center gap-2.5 rounded-lg border border-white/12 bg-white/[0.04] text-sm font-semibold text-white transition-all hover:border-primary/35 hover:bg-white/[0.07] hover:shadow-[0_0_28px_-6px_rgba(204,255,0,0.35)] active:scale-[0.99]"
    >
      <GoogleIcon />
      {loading ? "Redirecting to Google…" : "Sign in with Google"}
    </Button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
