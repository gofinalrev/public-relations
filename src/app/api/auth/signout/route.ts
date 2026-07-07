import { NextResponse } from "next/server";
import { appOrigin } from "@/lib/auth";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase";

export async function POST(request: Request) {
  const origin = appOrigin(new URL(request.url).origin);
  const client = await createSupabaseRouteHandlerClient();
  if (client) await client.supabase.auth.signOut();
  const response = NextResponse.redirect(`${origin}/`, { status: 303 });
  return client?.applyCookies(response) ?? response;
}
