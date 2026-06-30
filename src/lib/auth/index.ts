import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { authConfig } from "@/lib/auth/auth.config";
import { isAllowedEmail, isGoogleAuthConfigured } from "@/lib/auth/allowed-email";

function authOptions() {
  const providers = isGoogleAuthConfigured()
    ? [
        Google({
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          authorization: {
            params: {
              prompt: "select_account",
              hd: "finalrev.com",
              access_type: "online",
            },
          },
        }),
      ]
    : [];

  return {
    ...authConfig,
    providers,
    callbacks: {
      ...authConfig.callbacks,
      signIn({ user }: { user: { email?: string | null } }) {
        if (!isGoogleAuthConfigured()) return false;
        return isAllowedEmail(user.email);
      },
      session({ session, token }: { session: import("next-auth").Session; token: import("@auth/core/jwt").JWT }) {
        if (token.email && session.user) session.user.email = token.email as string;
        if (token.name && session.user) session.user.name = token.name as string;
        if (token.picture && session.user) session.user.image = token.picture as string;
        return session;
      },
      jwt({ token, user }: { token: import("@auth/core/jwt").JWT; user?: { email?: string | null; name?: string | null; image?: string | null } }) {
        if (user?.email) token.email = user.email;
        if (user?.name) token.name = user.name;
        if (user?.image) token.picture = user.image;
        return token;
      },
    },
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
