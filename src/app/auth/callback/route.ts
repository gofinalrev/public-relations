import { NextResponse } from "next/server";
import { appOrigin, isShopAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = appOrigin(url.origin);
  const nextPath = url.searchParams.get("next") || "/";
  const fail = () => NextResponse.redirect(`${origin}/access-denied`, { status: 303 });

  const supabase = await createSupabaseServerClient();
  const code = url.searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return fail();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isShopAdmin(user)) {
    await supabase.auth.signOut();
    return fail();
  }

  const dest = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/";
  return NextResponse.redirect(`${origin}${dest}`, { status: 303 });
}
