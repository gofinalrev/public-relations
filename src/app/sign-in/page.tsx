import { isAuthConfigured } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { EmailSignInForm } from "@/components/auth/email-sign-in-form";
import { OAuthRecovery } from "@/components/auth/oauth-recovery";
import { FinalrevLogo } from "@/components/dashboard/logo";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

type SignInPageProps = {
  searchParams: Promise<{ return?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  if (!isAuthConfigured()) notFound();

  const params = await searchParams;
  const returnTo = params.return?.startsWith("/") ? params.return : "/";

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.app_metadata?.user_role === "shop_admin") redirect(returnTo);

  return (
    <main className="safe-top safe-bottom flex min-h-dvh flex-col items-center justify-center bg-background px-4 sm:px-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="flex justify-center">
          <FinalrevLogo />
        </div>

        <EmailSignInForm returnTo={returnTo} />

        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden>
            <div className="w-full border-t border-foreground/10" />
          </div>
          <p className="relative mx-auto w-fit bg-background px-3 text-xs text-muted-foreground">or</p>
        </div>

        <details className="group text-left">
          <summary className="cursor-pointer list-none text-center text-xs text-muted-foreground marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="underline-offset-2 group-open:underline hover:text-foreground">
              Sign in with Google
            </span>
          </summary>
          <div className="mt-3 space-y-3">
            <GoogleSignInButton returnTo={returnTo} />
            <OAuthRecovery />
          </div>
        </details>
      </div>
    </main>
  );
}
