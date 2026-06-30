"use client";

import { useState, useTransition } from "react";
import { Copy, Check, Pin, Monitor, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ShareUrlInfo } from "@/lib/network-url";
import { saveTeamPublicUrl } from "@/app/team-url-actions";
import { cn } from "@/lib/utils";

type TeamShareLinkProps = {
  share: ShareUrlInfo;
  suggestedPin: string | null;
  isPinned: boolean;
};

export function TeamShareLink({ share, suggestedPin, isPinned }: TeamShareLinkProps) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(suggestedPin ?? share.url ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!share.url && !suggestedPin) return null;

  const displayUrl = share.url ?? suggestedPin!;
  const display = displayUrl.replace(/^https?:\/\//, "");
  const pinned = isPinned || share.source === "pinned";

  async function copy() {
    await navigator.clipboard.writeText(displayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function openPinForm() {
    setDraft(suggestedPin ?? share.url ?? "");
    setError(null);
    setEditing(true);
  }

  function savePin() {
    setError(null);
    startTransition(async () => {
      const result = await saveTeamPublicUrl(draft);
      if (!result.ok) {
        setError(result.error ?? "Could not save");
        return;
      }
      setEditing(false);
    });
  }

  if (editing) {
    return (
      <div className="flex w-full min-w-0 flex-col gap-1.5 sm:w-auto sm:min-w-[16rem]">
        <div className="flex min-w-0 items-center gap-1">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="http://your-mac.local:8787"
            className="h-9 min-w-0 flex-1 text-xs"
            disabled={pending}
            aria-label="Team bookmark URL"
          />
          <Button
            type="button"
            size="sm"
            className="h-9 shrink-0 px-2.5"
            disabled={pending || !draft.trim()}
            onClick={savePin}
          >
            {pending ? "…" : "Pin"}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-9 shrink-0"
            onClick={() => setEditing(false)}
            aria-label="Cancel"
          >
            <X className="size-4" />
          </Button>
        </div>
        {error && <p className="text-[11px] text-destructive">{error}</p>}
        {!pinned && (
          <p className="text-[10px] leading-snug text-muted-foreground">
            Same Wi‑Fi only. Pin once so PR can bookmark it while you dev.
          </p>
        )}
      </div>
    );
  }

  const Icon = pinned ? Pin : Monitor;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-10 shrink-0 sm:hidden"
        onClick={copy}
        aria-label={pinned ? "Copy team link" : "Copy share link"}
        title={displayUrl}
      >
        {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
      </Button>
      <div
        className={cn(
          "hidden min-w-0 items-center gap-1 text-xs sm:flex",
          pinned
            ? "border border-primary/25 bg-primary/[0.06] px-2 py-1 text-foreground"
            : "text-muted-foreground",
        )}
      >
        <Icon className={cn("size-3 shrink-0", pinned && "text-primary")} aria-hidden />
        <span className={cn("shrink-0 font-medium", pinned ? "text-primary" : "")}>
          {share.label}
        </span>
        <a
          href={displayUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="max-w-[100px] truncate hover:text-primary md:max-w-[160px] lg:max-w-none"
          title={displayUrl}
        >
          {display}
        </a>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          onClick={copy}
          aria-label="Copy link"
        >
          {copied ? <Check className="size-3 text-primary" /> : <Copy className="size-3" />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          onClick={openPinForm}
          aria-label={pinned ? "Edit team link" : "Pin link for team"}
          title={pinned ? "Edit pinned link" : "Pin for team"}
        >
          {pinned ? <Pencil className="size-3" /> : <Pin className="size-3" />}
        </Button>
      </div>
      {!pinned && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 shrink-0 px-2 text-xs sm:hidden"
          onClick={openPinForm}
        >
          Pin link
        </Button>
      )}
    </>
  );
}
