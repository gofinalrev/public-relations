import { FinalrevLogo } from "@/components/dashboard/logo";
import { EmailSignInForm } from "@/components/auth/email-sign-in-form";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { OAuthRecovery } from "@/components/auth/oauth-recovery";

type SignInPanelProps = {
  returnTo?: string;
};

export function SignInPanel({ returnTo = "/" }: SignInPanelProps) {
  return (
    <main className="safe-top safe-bottom flex min-h-dvh flex-col items-center justify-center bg-background px-4 sm:px-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="flex justify-center">
          <FinalrevLogo showSubtitle={false} />
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

export function buildAuthReturnPath(params: {
  return?: string;
  view?: string;
  week?: string;
}): string {
  if (params.return?.startsWith("/") && !params.return.startsWith("//")) {
    return params.return;
  }
  const qs = new URLSearchParams();
  if (params.view) qs.set("view", params.view);
  if (params.week) qs.set("week", params.week);
  const query = qs.toString();
  return query ? `/?${query}` : "/";
}
