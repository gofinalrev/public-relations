"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { sendLoginCode, verifyLoginCode } from "@/app/auth-actions";
import { Loader2, Mail } from "lucide-react";

type EmailSignInFormProps = {
  returnTo?: string;
};

export function EmailSignInForm({ returnTo = "/" }: EmailSignInFormProps) {
  const router = useRouter();
  const codeRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (step === "code") {
      const timer = window.setTimeout(() => codeRef.current?.focus(), 0);
      return () => window.clearTimeout(timer);
    }
  }, [step]);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const result = await sendLoginCode(email, returnTo);
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setStep("code");
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const result = await verifyLoginCode(email, code, returnTo);
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.push(result.redirectTo ?? "/");
    router.refresh();
  }

  async function resendCode() {
    setPending(true);
    setError(null);
    setCode("");

    const result = await sendLoginCode(email, returnTo);
    setPending(false);

    if (!result.ok) {
      setError(result.error);
    }
  }

  if (step === "code") {
    return (
      <form onSubmit={(e) => void handleVerifyCode(e)} className="space-y-3 text-left">
        <p className="text-center text-sm text-muted-foreground">
          Enter the code sent to{" "}
          <span className="font-medium text-foreground">{email.trim()}</span>
        </p>
        <label htmlFor="sign-in-code" className="sr-only">
          Login code
        </label>
        <input
          ref={codeRef}
          id="sign-in-code"
          type="text"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
            setError(null);
          }}
          placeholder="000000"
          disabled={pending}
          className="h-12 w-full border border-foreground/15 bg-card px-3 text-center text-2xl font-semibold tracking-[0.35em] text-foreground tabular-nums placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={pending || code.length !== 6}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50"
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          {pending ? "Verifying…" : "Sign in"}
        </button>
        <div className="flex items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setError(null);
            }}
            className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Different email
          </button>
          <button
            type="button"
            onClick={() => void resendCode()}
            disabled={pending}
            className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline disabled:opacity-50"
          >
            Resend code
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={(e) => void handleSendCode(e)} className="space-y-3 text-left">
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
        {pending ? "Sending…" : "Send login code"}
      </button>
    </form>
  );
}
