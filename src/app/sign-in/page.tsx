import { isAuthConfigured } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
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
        <FinalrevLogo />
        <p className="text-sm text-muted-foreground">Shop admin access · @finalrev.com</p>
        <GoogleSignInButton returnTo={returnTo} />
      </div>
    </main>
  );
}
