import { auth, signIn } from "@/lib/auth";
import { isAuthConfigured } from "@/lib/auth/allowed-email";
import { FinalrevLogo } from "@/components/dashboard/logo";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function SignInPage() {
  if (!isAuthConfigured()) notFound();

  const session = await auth();
  if (session?.shopAdmin) redirect("/");

  async function signInWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: "/" });
  }

  return (
    <main className="safe-top safe-bottom flex min-h-dvh flex-col items-center justify-center bg-background px-4 sm:px-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <FinalrevLogo />
        <p className="text-sm text-muted-foreground">Shop admin access · @finalrev.com</p>
        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-foreground/15 bg-card px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/50"
          >
            Continue with Google
          </button>
        </form>
      </div>
    </main>
  );
}
