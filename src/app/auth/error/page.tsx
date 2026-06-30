import Link from "next/link";
import { AuthBrand, AuthCard, AuthShell } from "@/components/auth/auth-shell";

type AuthErrorPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const { error } = await searchParams;

  const message =
    error === "AccessDenied"
      ? "Not an approved @finalrev.com account."
      : "Sign-in failed. Try again.";

  return (
    <AuthShell>
      <AuthBrand />
      <AuthCard>
        <p className="mb-6 text-sm text-white/55">{message}</p>
        <Link
          href="/login"
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.99]"
        >
          Back
        </Link>
      </AuthCard>
    </AuthShell>
  );
}
