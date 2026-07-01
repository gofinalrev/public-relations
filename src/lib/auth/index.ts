import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { authPages } from "@/lib/auth/auth.config";
import { isAllowedEmail } from "@/lib/auth/allowed-email";
import { verifyShopAdminByEmail } from "@/lib/auth/verify-shop-admin";

function authOptions(): NextAuthConfig {
  const hasGoogle =
    Boolean(process.env.AUTH_SECRET?.trim()) &&
    Boolean(process.env.GOOGLE_CLIENT_ID?.trim()) &&
    Boolean(process.env.GOOGLE_CLIENT_SECRET?.trim());

  const providers = hasGoogle
    ? [
        Google({
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          authorization: {
            params: {
              prompt: "select_account",
              hd: "finalrev.com",
            },
          },
        }),
      ]
    : [];

  return {
    trustHost: true,
    pages: authPages,
    session: { strategy: "jwt" as const },
    providers,
    callbacks: {
      async signIn({ user }) {
        if (!hasGoogle || !user.email) return false;
        if (!isAllowedEmail(user.email)) return false;
        return verifyShopAdminByEmail(user.email);
      },
      async jwt({ token, user }) {
        if (user?.email) {
          token.email = user.email;
          token.shopAdmin = await verifyShopAdminByEmail(user.email);
        }
        return token;
      },
      session({ session, token }) {
        if (token.email && session.user) session.user.email = token.email as string;
        if (token.name && session.user) session.user.name = token.name as string;
        if (token.picture && session.user) session.user.image = token.picture as string;
        session.shopAdmin = Boolean(token.shopAdmin);
        return session;
      },
    },
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
