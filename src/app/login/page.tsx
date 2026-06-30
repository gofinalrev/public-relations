import { signIn, auth } from "@/lib/auth";
import {
  getAllowedEmailDomains,
  isAuthConfigured,
  isEmailAuthConfigured,
  isGoogleAuthConfigured,
} from "@/lib/auth/allowed-email";
import { AuthBrand, AuthCard, AuthShell } from "@/components/auth/auth-shell";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const session = await auth();
  if (session?.user) {
    redirect(params.callbackUrl ?? "/");
  }

  const googleReady = isGoogleAuthConfigured();
  const emailReady = isEmailAuthConfigured();
  const configured = isAuthConfigured();
  const domains = getAllowedEmailDomains().join(", @");

  async function signInWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: params.callbackUrl ?? "/" });
  }

  async function signInWithEmail(formData: FormData) {
    "use server";
    const email = (formData.get("email") as string)?.trim();
    if (!email) return;
    await signIn("resend", { email, redirectTo: params.callbackUrl ?? "/" });
  }

  return (
    <AuthShell>
      <AuthBrand />
      <AuthCard>
        {params.error === "AccessDenied" && (
          <p className="mb-5 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            Use an @{domains} account.
          </p>
        )}

        {params.error === "Verification" && (
          <p className="mb-5 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            Link expired or already used. Request a new one below.
          </p>
        )}

        {configured ? (
          <div className="space-y-4">
            {googleReady && (
              <form action={signInWithGoogle}>
                <button
                  type="submit"
                  className="flex h-12 w-full items-center justify-center gap-2.5 rounded-lg border border-white/12 bg-white/[0.04] text-sm font-semibold text-white transition-all hover:border-primary/35 hover:bg-white/[0.07] hover:shadow-[0_0_28px_-6px_rgba(204,255,0,0.35)] active:scale-[0.99]"
                >
                  <GoogleIcon />
                  Continue with Google
                </button>
              </form>
            )}

            {emailReady && (
              <form action={signInWithEmail} className="space-y-3">
                {googleReady && (
                  <p className="text-center text-[11px] uppercase tracking-wider text-white/35">or</p>
                )}
                <label htmlFor="email" className="sr-only">
                  Work email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder={`you@${getAllowedEmailDomains()[0] ?? "finalrev.com"}`}
                  className="flex h-11 w-full rounded-lg border border-white/12 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/35 focus:border-primary/40 focus:outline-none"
                />
                <button
                  type="submit"
                  className="flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.99]"
                >
                  Email me a sign-in link
                </button>
                <p className="text-center text-[11px] text-white/40">
                  One-time link to your @{domains} inbox. Check spam if needed.
                </p>
              </form>
            )}
          </div>
        ) : (
          <div className="space-y-2 text-sm text-white/55">
            <p>Sign-in is not configured on this server.</p>
            <p className="text-xs text-white/40">
              Production needs AUTH_SECRET plus RESEND_API_KEY or Google OAuth credentials in Vercel env.
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
