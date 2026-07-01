import { isAuthConfigured } from "@/lib/auth/allowed-email";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";

export async function UserMenu() {
  if (!isAuthConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const name = user.user_metadata?.full_name?.split(" ")[0] ?? user.email.split("@")[0] ?? "Team";
  const initial = name.charAt(0).toUpperCase();

  async function handleSignOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/sign-in");
  }

  return (
    <form action={handleSignOut} className="flex items-center gap-2">
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
        title={user.email}
        aria-hidden
      >
        {initial}
      </div>
      <span className="hidden max-w-[5rem] truncate text-sm font-medium sm:inline md:max-w-[8rem]" title={user.email}>
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
