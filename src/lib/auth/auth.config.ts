import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  providers: [],
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user?.email) token.email = user.email;
      if (user?.name) token.name = user.name;
      if (user?.image) token.picture = user.image;
      return token;
    },
    session({ session, token }) {
      if (token.email && session.user) session.user.email = token.email as string;
      if (token.name && session.user) session.user.name = token.name as string;
      if (token.picture && session.user) session.user.image = token.picture as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
