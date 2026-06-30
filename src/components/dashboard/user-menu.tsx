import { auth, signOut } from "@/lib/auth";
import { isGoogleAuthConfigured } from "@/lib/auth/allowed-email";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export async function UserMenu() {
  if (!isGoogleAuthConfigured()) return null;

  const session = await auth();
  if (!session?.user) return null;

  const name = session.user.name?.split(" ")[0] ?? session.user.email?.split("@")[0] ?? "Team";
  const initial = name.charAt(0).toUpperCase();

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <form action={handleSignOut} className="flex items-center gap-2">
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
        title={session.user.email ?? undefined}
        aria-hidden
      >
        {initial}
      </div>
      <span
        className="hidden max-w-[5rem] truncate text-sm font-medium sm:inline md:max-w-[8rem]"
        title={session.user.email ?? undefined}
      >
        {name}
      </span>
      <Button
        type="submit"
        size="icon"
        variant="ghost"
        title="Sign out"
        aria-label="Sign out"
        className="size-9 shrink-0 text-muted-foreground hover:text-foreground"
      >
        <LogOut className="size-4" />
      </Button>
    </form>
  );
}
