"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

type Preview = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
};

const BRAND_URL =
  /https?:\/\/(?:www\.)?(?:finalrev\.com|tooltrace\.ai)[^\s)>"']*/gi;

function firstBrandUrl(text: string): string | null {
  const match = text.match(BRAND_URL);
  return match?.[0] ?? null;
}

export function CaptionLinkPreview({ text }: { text: string }) {
  const url = firstBrandUrl(text);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!url) {
      setPreview(null);
      setFailed(false);
      return;
    }

    let cancelled = false;
    setFailed(false);

    fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: Preview) => {
        if (!cancelled) setPreview(data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!url) return null;

  if (failed) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex items-center gap-1 text-[11px] text-primary hover:underline"
      >
        <ExternalLink className="size-3" />
        {url.replace(/^https?:\/\//, "")}
      </a>
    );
  }

  if (!preview) {
    return <p className="mt-2 text-[10px] text-muted-foreground">Loading link preview…</p>;
  }

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 flex gap-2 border border-foreground/[0.08] bg-muted/20 p-2 transition-colors hover:border-primary/30"
    >
      {preview.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview.image}
          alt=""
          className="size-12 shrink-0 object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {preview.siteName ?? "Link preview"}
        </p>
        {preview.title && (
          <p className="line-clamp-1 text-xs font-semibold">{preview.title}</p>
        )}
        {preview.description && (
          <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">
            {preview.description}
          </p>
        )}
      </div>
    </a>
  );
}
