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
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="glass-panel w-full max-w-[22rem] space-y-6 p-8 text-center sm:max-w-md sm:p-10">
        <div className="flex justify-center">
          <FinalrevLogo />
        </div>
        <div>
          <h1 className="text-lg font-bold">Couldn&apos;t sign in</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{message}</p>
        </div>
        <Button asChild className="w-full">
          <Link href="/login">Try again</Link>
        </Button>
      </div>
    </div>
  );
}
