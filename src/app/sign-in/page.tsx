import { auth, signIn } from "@/lib/auth";
import { isAuthConfigured } from "@/lib/auth/allowed-email";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function SignInPage() {
  if (!isAuthConfigured()) {
    notFound();
  }

  const session = await auth();
  if (session?.shopAdmin) {
    redirect("/");
  }

  async function signInWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: "/" });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fafafa] px-6">
      <form action={signInWithGoogle} className="w-full max-w-sm">
        <button
          type="submit"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[#dadce0] bg-white px-4 text-sm font-medium text-[#3c4043] shadow-sm hover:bg-[#f8f9fa]"
        >
          Continue with Google
        </button>
      </form>
    </main>
  );
}
