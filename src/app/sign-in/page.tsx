import { hasPrHubAccess } from "@/lib/auth/pr-access";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { GoogleSignIn } from "@/components/auth/google-sign-in";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function SignInPage() {
  if (!isSupabaseAuthConfigured()) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (hasPrHubAccess(user)) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fafafa] px-6">
      <div className="w-full max-w-sm space-y-4 text-center">
        <GoogleSignIn autoRedirect={false} />
      </div>
    </main>
  );
}
