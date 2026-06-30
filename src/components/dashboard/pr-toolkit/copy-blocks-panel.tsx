"use client";

import { useState } from "react";
import { COPY_BLOCKS, PRODUCT_ONE_LINERS, CONTENT_PILLARS } from "@/lib/pr-toolkit/copy-blocks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlatformLogo } from "@/components/dashboard/platform-logo";
import { Copy, Check } from "lucide-react";

export function CopyBlocksPanel() {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/15">
        <CardHeader>
          <CardTitle className="text-base">One-liners</CardTitle>
          <CardDescription>Product one-liners for Tooltrace, finalREV, or both</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(["tooltrace", "finalrev", "both"] as const).map((key) => (
            <CopyRow
              key={key}
              id={`oneliner-${key}`}
              label={key === "both" ? "Combined" : key === "tooltrace" ? "Tooltrace" : "finalREV"}
              text={PRODUCT_ONE_LINERS[key]}
              product={key === "both" ? "finalrev" : key}
              copied={copied}
              onCopy={copy}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Platform copy blocks</CardTitle>
          <CardDescription>Bios, hooks, and CTAs. Tap to copy.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {COPY_BLOCKS.map((block) => (
            <CopyRow
              key={block.id}
              id={block.id}
              label={block.label}
              text={block.text}
              product={block.product === "both" ? "tooltrace" : block.product}
              platform={block.platform}
              maxChars={block.maxChars}
              copied={copied}
              onCopy={copy}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Content pillars</CardTitle>
          <CardDescription>Default content themes when metrics are flat.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {CONTENT_PILLARS.map((pillar) => (
            <div key={pillar.id} className="border border-foreground/[0.08] p-3">
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <PlatformLogo platformOrSlug={pillar.product} size="sm" />
                <span className="text-sm font-semibold">{pillar.title}</span>
              </div>
              <p className="text-xs text-muted-foreground">{pillar.idea}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {pillar.bestOn.map((p) => (
                  <Badge key={p} variant="outline" className="gap-1 text-[10px] font-normal">
                    <PlatformLogo platformOrSlug={p} size="sm" />
                    {p}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function CopyRow({
  id,
  label,
  text,
  product,
  platform,
  maxChars,
  copied,
  onCopy,
}: {
  id: string;
  label: string;
  text: string;
  product: "tooltrace" | "finalrev";
  platform?: string;
  maxChars?: number;
  copied: string | null;
  onCopy: (text: string, id: string) => void;
}) {
  return (
    <div className="flex items-start gap-3 border border-foreground/[0.08] p-3">
      <PlatformLogo platformOrSlug={product} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-medium">{label}</p>
          {platform && platform !== "all" && (
            <Badge variant="secondary" className="text-[10px]">{platform}</Badge>
          )}
          {maxChars && (
            <span className="text-[10px] text-muted-foreground">≤{maxChars} chars</span>
          )}
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
      </div>
      <Button type="button" size="sm" variant="secondary" className="shrink-0" onClick={() => onCopy(text, id)}>
        {copied === id ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </Button>
    </div>
  );
}
