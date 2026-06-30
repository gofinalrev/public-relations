import { auth, signOut } from "@/lib/auth";
import { isGoogleAuthConfigured } from "@/lib/auth/allowed-email";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export async function UserMenu() {
  if (!isGoogleAuthConfigured()) return null;

  const session = await auth();
  if (!session?.user) return null;

  const label = session.user.name?.split(" ")[0] ?? session.user.email?.split("@")[0] ?? "Team";

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <form action={handleSignOut} className="flex items-center gap-2">
      <span className="hidden text-xs text-muted-foreground sm:inline" title={session.user.email ?? undefined}>
        {label}
      </span>
      <Button type="submit" size="sm" variant="ghost" title="Sign out" className="min-h-[44px] sm:min-h-0">
        <LogOut className="size-4" />
      </Button>
    </form>
  );
}
