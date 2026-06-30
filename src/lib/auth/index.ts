import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { authConfig } from "@/lib/auth/auth.config";
import { isAllowedEmail, isGoogleAuthConfigured } from "@/lib/auth/allowed-email";

const providers = isGoogleAuthConfigured()
  ? [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        authorization: { params: { prompt: "select_account", hd: "finalrev.com" } },
      }),
    ]
  : [];

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    signIn({ user, profile }) {
      if (!isGoogleAuthConfigured()) return false;
      const email = user.email ?? profile?.email;
      return isAllowedEmail(typeof email === "string" ? email : null);
    },
    session({ session, token }) {
      if (token.email && session.user) session.user.email = token.email as string;
      if (token.name && session.user) session.user.name = token.name as string;
      if (token.picture && session.user) session.user.image = token.picture as string;
      return session;
    },
    jwt({ token, user }) {
      if (user?.email) token.email = user.email;
      if (user?.name) token.name = user.name;
      if (user?.image) token.picture = user.image;
      return token;
    },
  },
});
