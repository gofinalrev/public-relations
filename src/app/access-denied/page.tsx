import Link from "next/link";
import { isAuthConfigured } from "@/lib/auth";

export const metadata = {
  title: "Access denied",
  robots: { index: false, follow: false },
};

export default function AccessDeniedPage() {
  const authOn = isAuthConfigured();

  return (
    <main className="safe-top safe-bottom flex min-h-dvh items-center justify-center bg-background px-4 sm:px-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">finalREV PR</p>
        <h1 className="mt-2 text-2xl font-semibold">Access restricted</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This account doesn&apos;t have access to the PR dashboard.
        </p>
        {authOn && (
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center bg-primary px-5 text-sm font-medium text-primary-foreground"
            >
              Try another account
            </Link>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="inline-flex h-10 w-full items-center justify-center border border-foreground/15 px-5 text-sm font-medium sm:w-auto"
              >
                Sign out
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
