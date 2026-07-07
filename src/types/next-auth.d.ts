import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    shopAdmin?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    shopAdmin?: boolean;
  }
}
