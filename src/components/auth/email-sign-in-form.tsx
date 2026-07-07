"use client";

import { useState } from "react";
import { sendMagicLink } from "@/app/auth-actions";
import { CheckCircle2, Loader2, Mail } from "lucide-react";

type EmailSignInFormProps = {
  returnTo?: string;
};

export function EmailSignInForm({ returnTo = "/" }: EmailSignInFormProps) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const result = await sendMagicLink(email, returnTo);
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-3 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.06] p-4 text-left">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div>
            <p className="text-sm font-medium">Check your email</p>
            <p className="mt-1 text-sm text-muted-foreground">
              If you have access, we sent a sign-in link to{" "}
              <span className="font-medium text-foreground">{email.trim()}</span>. Open it on this device to
              continue.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setError(null);
          }}
          className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3 text-left">
      <label htmlFor="sign-in-email" className="sr-only">
        Email
      </label>
      <div className="relative">
        <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id="sign-in-email"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          placeholder="you@company.com"
          disabled={pending}
          className="h-11 w-full border border-foreground/15 bg-card py-2 pr-3 pl-10 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <button
        type="submit"
        disabled={pending || !email.trim()}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50"
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        {pending ? "Sending…" : "Email me a sign-in link"}
      </button>
      <p className="text-center text-xs text-muted-foreground">No password — one tap in your inbox.</p>
    </form>
  );
}
