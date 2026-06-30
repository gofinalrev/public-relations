import Link from "next/link";
import { AuthCard, AuthShell } from "@/components/auth/auth-shell";

type AuthErrorPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const { error } = await searchParams;

  const message =
    error === "AccessDenied"
      ? "Your Google account is not on the approved finalREV team list."
      : "Something went wrong during sign-in. Try again or contact the team.";

  return (
    <AuthShell>
      <AuthCard className="text-center sm:text-left">
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-primary/80">
              Sign-in
            </p>
            <h1 className="text-2xl font-black tracking-tight text-white">Couldn&apos;t sign in</h1>
            <p className="text-sm leading-relaxed text-white/55">{message}</p>
          </div>
          <Link
            href="/login"
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-[0_0_24px_-6px_rgba(204,255,0,0.45)] transition-all hover:brightness-110 active:scale-[0.99]"
          >
            Try again
          </Link>
        </div>
      </AuthCard>
    </AuthShell>
  );
}
