"use client";

import { useEffect, useState } from "react";

const PENDING_KEY = "pr_oauth_pending";

export function markOAuthPending() {
  try {
    sessionStorage.setItem(PENDING_KEY, "1");
  } catch {
    /* private mode */
  }
}

function clearOAuthPending() {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

function extractCode(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = trimmed.startsWith("http") ? new URL(trimmed) : new URL(trimmed, window.location.origin);
    return url.searchParams.get("code");
  } catch {
    return /^[0-9a-f-]{36}$/i.test(trimmed) ? trimmed : null;
  }
}

export function OAuthRecovery() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(PENDING_KEY) === "1") setOpen(true);
    } catch {
      /* ignore */
    }
  }, []);

  function recover() {
    const code = extractCode(value);
    if (!code) {
      setError("Paste the full URL from your browser after Google sign-in.");
      return;
    }
    clearOAuthPending();
    window.location.href = `/api/auth/callback?code=${encodeURIComponent(code)}`;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        Trouble signing in?
      </button>
    );
  }

  return (
    <div className="mt-4 space-y-2 border-t border-foreground/10 pt-4 text-left">
      <p className="text-xs text-muted-foreground">
        Paste the URL from your browser after Google sign-in, then continue.
      </p>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError(null);
        }}
        placeholder="https://…"
        className="h-9 w-full border border-foreground/15 bg-background px-3 text-sm"
        autoComplete="off"
        spellCheck={false}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <button
        type="button"
        onClick={recover}
        className="h-9 w-full bg-primary text-sm font-medium text-primary-foreground"
      >
        Continue
      </button>
    </div>
  );
}
