import { isAuthConfigured, isShopAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export async function UserMenu() {
  if (!isAuthConfigured()) return null;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isShopAdmin(user)) return null;

  const name = user!.user_metadata?.full_name?.split(" ")[0] ?? user!.email?.split("@")[0] ?? "Team";

  return (
    <form action="/api/auth/signout" method="POST" className="flex items-center gap-2">
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
        title={user!.email ?? undefined}
        aria-hidden
      >
        {name.charAt(0).toUpperCase()}
      </div>
      <span
        className="hidden max-w-[5rem] truncate text-sm font-medium sm:inline md:max-w-[8rem]"
        title={user!.email ?? undefined}
      >
        {name}
      </span>
      <Button type="submit" size="icon" variant="ghost" title="Sign out" aria-label="Sign out" className="size-9 shrink-0 text-muted-foreground hover:text-foreground">
        <LogOut className="size-4" />
      </Button>
    </form>
  );
}
