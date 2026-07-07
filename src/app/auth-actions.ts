"use server";

import { cookies } from "next/headers";
import { AUTH_RETURN_COOKIE, isAllowedEmail, safeReturnPath } from "@/lib/auth";
import { PR_HUB_ORIGIN } from "@/lib/app-origin";
import { createSupabaseServerClient } from "@/lib/supabase";

export type MagicLinkResult = { ok: true } | { ok: false; error: string };

export async function sendMagicLink(email: string, returnTo: string): Promise<MagicLinkResult> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  if (!isAllowedEmail(normalized)) {
    // Same copy as success — do not reveal allowlist on a public page.
    return { ok: true };
  }

  const cookieStore = await cookies();
  cookieStore.set(AUTH_RETURN_COOKIE, safeReturnPath(returnTo), {
    path: "/",
    maxAge: 3600,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: {
        emailRedirectTo: PR_HUB_ORIGIN,
        shouldCreateUser: false,
      },
    });

    if (error) {
      console.error("Magic link error:", error.message);
      return { ok: true };
    }

    return { ok: true };
  } catch (err) {
    console.error("Magic link failed:", err);
    return { ok: false, error: "Could not send email. Try again in a moment." };
  }
}
