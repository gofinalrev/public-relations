import { NextResponse } from "next/server";
import { appOrigin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = appOrigin(url.origin);
  const returnTo = url.searchParams.get("return") || "/";
  const callbackUrl = `${origin}/?next=${encodeURIComponent(returnTo)}`;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl,
      queryParams: { hd: "finalrev.com", prompt: "select_account" },
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(`${origin}/access-denied`, { status: 303 });
  }
  return NextResponse.redirect(data.url);
}
