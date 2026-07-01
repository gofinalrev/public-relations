import "next-auth";

declare module "next-auth" {
  interface Session {
    shopAdmin?: boolean;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    shopAdmin?: boolean;
  }
}
