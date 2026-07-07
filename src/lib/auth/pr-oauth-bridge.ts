/** Set on pr.finalrev.com before OAuth; read on finalrev.com to forward ?code= back to PR hub. */
export const PR_OAUTH_BRIDGE_COOKIE = "fr_pr_oauth";

export const PR_HUB_ORIGIN = "https://pr.finalrev.com";

export function prOAuthBridgeCookieOptions(maxAge = 600) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge,
    path: "/",
    domain: ".finalrev.com",
  };
}
