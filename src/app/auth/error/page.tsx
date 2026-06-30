import Link from "next/link";
import { FinalrevLogo } from "@/components/dashboard/logo";
import { Button } from "@/components/ui/button";

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
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6 text-center">
        <FinalrevLogo />
        <h1 className="text-lg font-bold">Sign-in failed</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
        <Button asChild>
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    </div>
  );
}
