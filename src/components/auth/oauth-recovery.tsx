"use client";

import { useEffect, useState } from "react";
import { PR_HUB_ORIGIN } from "@/lib/app-origin";

const PENDING_KEY = "pr_oauth_pending";

/** One-click on finalrev.com after Google redirect — drag to bookmarks bar on sign-in page. */
export const OAUTH_COMPLETE_BOOKMARKLET = `javascript:(function(){var s=location.search;if(!/[?&]code=/.test(s)){alert('Use this on the page right after Google sign-in (URL should contain ?code=).');return;}location.href='${PR_HUB_ORIGIN}/api/auth/callback'+s;})();`;

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
      setError("Paste the full URL, or just the code from the address bar.");
      return;
    }
    clearOAuthPending();
    window.location.href = `/api/auth/callback?code=${encodeURIComponent(code)}`;
  }

  async function pasteFromClipboard() {
    setError(null);
    try {
      const text = await navigator.clipboard.readText();
      setValue(text);
      const code = extractCode(text);
      if (!code) {
        setError("Clipboard does not contain a sign-in code.");
        return;
      }
      clearOAuthPending();
      window.location.href = `/api/auth/callback?code=${encodeURIComponent(code)}`;
    } catch {
      setError("Could not read clipboard — paste manually or use the bookmark instead.");
    }
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
    <div className="mt-4 space-y-3 border-t border-foreground/10 pt-4 text-left">
      <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/[0.04] p-3">
        <p className="text-xs font-medium text-foreground">Fastest workaround</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Drag this to your bookmarks bar once. After Google sends you to finalrev.com, click the bookmark — no
          copy/paste.
        </p>
        <a
          href={OAUTH_COMPLETE_BOOKMARKLET}
          className="inline-flex h-9 items-center rounded-md border border-foreground/15 bg-background px-3 text-xs font-medium text-foreground hover:bg-muted/50"
          onClick={(e) => e.preventDefault()}
        >
          Complete PR sign-in
        </a>
      </div>

      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer select-none hover:text-foreground">Or paste URL / code manually</summary>
        <div className="mt-2 space-y-2">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            placeholder="Full URL or code only"
            className="h-9 w-full border border-foreground/15 bg-background px-3 text-sm"
            autoComplete="off"
            spellCheck={false}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={recover}
              className="h-9 flex-1 bg-primary text-sm font-medium text-primary-foreground"
            >
              Continue
            </button>
            <button
              type="button"
              onClick={() => void pasteFromClipboard()}
              className="h-9 flex-1 border border-foreground/15 bg-background text-sm font-medium text-foreground hover:bg-muted/50"
            >
              Paste from clipboard
            </button>
          </div>
        </div>
      </details>
    </div>
  );
}
