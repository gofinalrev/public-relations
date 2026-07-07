import { redirect } from "next/navigation";
import { isAuthConfigured } from "@/lib/auth";
import { buildAuthReturnPath } from "@/components/auth/sign-in-panel";

type SignInRedirectProps = {
  searchParams: Promise<{ return?: string }>;
};

/** Legacy URL — always land on the site root. */
export default async function SignInRedirectPage({ searchParams }: SignInRedirectProps) {
  if (!isAuthConfigured()) redirect("/");

  const params = await searchParams;
  const target = buildAuthReturnPath(params);
  redirect(target);
}
