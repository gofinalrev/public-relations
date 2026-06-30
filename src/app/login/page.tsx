import { signIn, auth } from "@/lib/auth";
import { isGoogleAuthConfigured } from "@/lib/auth/allowed-email";
import { getAllowedEmailDomains } from "@/lib/auth/allowed-email";
import { FinalrevLogo } from "@/components/dashboard/logo";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const session = await auth();
  if (session?.user) {
    redirect(params.callbackUrl ?? "/");
  }

  const configured = isGoogleAuthConfigured();
  const domains = getAllowedEmailDomains().join(", @");

  async function signInWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: params.callbackUrl ?? "/" });
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="flex justify-center">
          <FinalrevLogo />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">PR Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with Google · <span className="font-medium text-foreground">@{domains}</span>
          </p>
        </div>

        {params.error === "AccessDenied" && (
          <p className="border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Access denied — use an approved @finalrev.com Google account.
          </p>
        )}

        {configured ? (
          <form action={signInWithGoogle}>
            <Button type="submit" size="lg" className="w-full min-h-[44px] gap-2">
              <GoogleIcon />
              Sign in with Google
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            Google sign-in is not configured yet. Add{" "}
            <code className="text-xs">GOOGLE_CLIENT_ID</code>,{" "}
            <code className="text-xs">GOOGLE_CLIENT_SECRET</code>, and{" "}
            <code className="text-xs">AUTH_SECRET</code> to <code className="text-xs">.env.local</code>.
          </p>
        )}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
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
