import { getAllowedEmailDomains, isAllowedEmail } from "@/lib/auth/allowed-email";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { AuthBrand, AuthCard, AuthShell } from "@/components/auth/auth-shell";
import { GoogleSignIn } from "@/components/auth/google-sign-in";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? "/";
  const domains = getAllowedEmailDomains().join(", @");

  if (isSupabaseAuthConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.email && isAllowedEmail(user.email)) {
      redirect(callbackUrl);
    }
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

        <GoogleSignIn callbackUrl={callbackUrl} autoRedirect={!params.error} />
        <p className="mt-3 text-center text-[11px] text-white/40">@{domains} accounts only</p>
      </AuthCard>
    </AuthShell>
  );
}
