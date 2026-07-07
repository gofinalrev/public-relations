import Link from "next/link";
import { isAuthConfigured } from "@/lib/auth/allowed-email";

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
        <h1 className="mt-2 text-2xl font-semibold">Shop admin access only</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Sign in with a <span className="font-medium text-foreground">@finalrev.com</span> Google account
          that has shop admin access.
        </p>
        {authOn && (
          <div className="mt-6">
            <Link
              href="/sign-in"
              className="inline-flex h-10 items-center justify-center bg-primary px-5 text-sm font-medium text-primary-foreground"
            >
              Try another account
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
