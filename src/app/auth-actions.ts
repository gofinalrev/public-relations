"use server";

import { cookies } from "next/headers";
import { AUTH_RETURN_COOKIE, isAllowedEmail, isShopAdmin, safeReturnPath } from "@/lib/auth";
import { PR_HUB_ORIGIN } from "@/lib/app-origin";
import { createSupabaseServerClient } from "@/lib/supabase";

export type AuthActionResult =
  | { ok: true; redirectTo?: string }
  | { ok: false; error: string };

export async function sendLoginCode(email: string, returnTo: string): Promise<AuthActionResult> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  if (!isAllowedEmail(normalized)) {
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
      console.error("Login code error:", error.message);
      return { ok: true };
    }

    return { ok: true };
  } catch (err) {
    console.error("Login code failed:", err);
    return { ok: false, error: "Could not send email. Try again in a moment." };
  }
}

export async function verifyLoginCode(
  email: string,
  code: string,
  returnTo: string,
): Promise<AuthActionResult> {
  const normalized = email.trim().toLowerCase();
  const token = code.replace(/\s/g, "");
  if (!normalized || !/^\d{6}$/.test(token)) {
    return { ok: false, error: "Enter the 6-digit code from your email." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({
      email: normalized,
      token,
      type: "email",
    });

    if (error) {
      console.error("Verify code error:", error.message);
      return { ok: false, error: "Invalid or expired code. Request a new one." };
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!isShopAdmin(user)) {
      await supabase.auth.signOut();
      return { ok: false, error: "Access restricted." };
    }

    const cookieStore = await cookies();
    const redirectTo =
      safeReturnPath(cookieStore.get(AUTH_RETURN_COOKIE)?.value) || safeReturnPath(returnTo);

    return { ok: true, redirectTo };
  } catch (err) {
    console.error("Verify code failed:", err);
    return { ok: false, error: "Could not verify code. Try again." };
  }
}
