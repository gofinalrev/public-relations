import { signIn, auth } from "@/lib/auth";
import { getAllowedEmailDomains, isGoogleAuthConfigured } from "@/lib/auth/allowed-email";
import { AuthBrand, AuthCard, AuthShell } from "@/components/auth/auth-shell";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const session = await auth();
  const callbackUrl = params.callbackUrl ?? "/";

  if (session?.user) {
    redirect(callbackUrl);
  }

  const googleReady = isGoogleAuthConfigured();
  const domains = getAllowedEmailDomains().join(", @");

  // One click: land on /login → go straight to Google account picker.
  if (googleReady && !params.error) {
    await signIn("google", { redirectTo: callbackUrl });
  }

  async function signInWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: callbackUrl });
  }

  return (
    <AuthShell>
      <AuthBrand />
      <AuthCard>
        {params.error === "AccessDenied" && (
          <p className="mb-5 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            Use your @{domains} Google account.
          </p>
        )}

        {(params.error === "OAuthSignin" ||
          params.error === "OAuthCallback" ||
          params.error === "Configuration") && (
          <p className="mb-5 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            Google sign-in failed. Try again or contact your admin.
          </p>
        )}

        {googleReady ? (
          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center gap-2.5 rounded-lg border border-white/12 bg-white/[0.04] text-sm font-semibold text-white transition-all hover:border-primary/35 hover:bg-white/[0.07] hover:shadow-[0_0_28px_-6px_rgba(204,255,0,0.35)] active:scale-[0.99]"
            >
              <GoogleIcon />
              Sign in with Google
            </button>
            <p className="mt-3 text-center text-[11px] text-white/40">
              @{domains} accounts only
            </p>
          </form>
        ) : (
          <div className="space-y-2 text-sm text-white/55">
            <p>Google sign-in is not configured on this server.</p>
            <p className="text-xs text-white/40">
              Admin: run <code className="text-white/60">bash scripts/setup-google-oauth.sh</code> then redeploy.
            </p>
          </div>
        )}
      </AuthCard>
    </AuthShell>
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
