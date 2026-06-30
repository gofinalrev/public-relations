"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  BRAND_ASSETS,
  MARKETING_MEDIA,
  type MarketingMediaItem,
} from "@/lib/pr-toolkit/brand-assets";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformLogo } from "@/components/dashboard/platform-logo";
import { Download, Copy, Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

type BrandFilter = "all" | "finalrev" | "tooltrace";

const CATEGORY_LABELS: Record<MarketingMediaItem["category"], string> = {
  hero: "Hero",
  product: "Product",
  "shop-floor": "Shop floor",
  tutorial: "Tutorial",
  examples: "Examples",
  team: "Team / mission",
  equipment: "Equipment",
};

export function BrandAssetsPanel() {
  const [copied, setCopied] = useState<string | null>(null);
  const [brandFilter, setBrandFilter] = useState<BrandFilter>("all");

  async function copyPath(path: string, id: string) {
    const full = `${window.location.origin}${path}`;
    await navigator.clipboard.writeText(full);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  async function copyUrl(url: string, id: string) {
    await navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const finalrev = BRAND_ASSETS.filter((a) => a.brand === "finalrev");
  const tooltrace = BRAND_ASSETS.filter((a) => a.brand === "tooltrace");

  const filteredMedia = useMemo(
    () =>
      brandFilter === "all"
        ? MARKETING_MEDIA
        : MARKETING_MEDIA.filter((item) => item.brand === brandFilter),
    [brandFilter],
  );

  const tooltraceCount = MARKETING_MEDIA.filter((m) => m.brand === "tooltrace").length;
  const finalrevCount = MARKETING_MEDIA.filter((m) => m.brand === "finalrev").length;

  return (
    <div className="space-y-4">
      <AssetGroup title="finalREV" brand="finalrev" assets={finalrev} copied={copied} onCopy={copyPath} />
      <AssetGroup title="Tooltrace" brand="tooltrace" assets={tooltrace} copied={copied} onCopy={copyPath} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Marketing screenshots</CardTitle>
          <CardDescription>
            {MARKETING_MEDIA.length} assets from tooltrace.ai and finalrev.com. Open to download for posts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: "all" as const, label: `All (${MARKETING_MEDIA.length})` },
                { id: "tooltrace" as const, label: `Tooltrace (${tooltraceCount})` },
                { id: "finalrev" as const, label: `finalREV (${finalrevCount})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setBrandFilter(tab.id)}
                className={cn(
                  "border px-2.5 py-1 text-xs font-medium transition-colors",
                  brandFilter === tab.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-foreground/[0.08] text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMedia.map((item) => (
              <MarketingMediaCard
                key={item.id}
                item={item}
                copied={copied}
                onCopyUrl={copyUrl}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MarketingMediaCard({
  item,
  copied,
  onCopyUrl,
}: {
  item: MarketingMediaItem;
  copied: string | null;
  onCopyUrl: (url: string, id: string) => void;
}) {
  return (
    <div className="group border border-foreground/[0.08] p-3">
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <div className="relative mb-2 aspect-video overflow-hidden bg-muted">
          <Image
            src={item.url}
            alt={item.label}
            fill
            className="object-cover transition-transform group-hover:scale-[1.02]"
            unoptimized
          />
        </div>
      </a>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1">
            <PlatformLogo platformOrSlug={item.brand} size="sm" />
            <Badge variant="secondary" className="text-[10px] font-normal">
              {CATEGORY_LABELS[item.category]}
            </Badge>
          </div>
          <p className="text-sm font-medium">{item.label}</p>
          <p className="text-[11px] text-muted-foreground">{item.note}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <Button type="button" size="sm" variant="secondary" asChild>
            <a href={item.url} target="_blank" rel="noopener noreferrer" download>
              <Download className="size-3" />
            </a>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            title="Copy image URL"
            onClick={() => onCopyUrl(item.url, item.id)}
          >
            {copied === item.id ? <Check className="size-3" /> : <Copy className="size-3" />}
          </Button>
          <Button type="button" size="sm" variant="ghost" asChild>
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-3" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

function AssetGroup({
  title,
  brand,
  assets,
  copied,
  onCopy,
}: {
  title: string;
  brand: "finalrev" | "tooltrace";
  assets: typeof BRAND_ASSETS;
  copied: string | null;
  onCopy: (path: string, id: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PlatformLogo platformOrSlug={brand} size="sm" />
          {title}
        </CardTitle>
        <CardDescription>SVG logos from {title}. Use dark variants on dark backgrounds.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        {assets.map((asset) => (
          <div key={asset.id} className="flex items-center gap-3 border border-foreground/[0.08] p-3">
            <div className="relative flex h-12 w-20 shrink-0 items-center justify-center rounded bg-muted p-1">
              <Image src={asset.path} alt={asset.name} width={72} height={32} className="max-h-10 w-auto object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium">{asset.name}</p>
              <p className="text-[10px] text-muted-foreground">{asset.usage}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-1">
              <Button type="button" size="sm" variant="secondary" asChild>
                <a href={asset.path} download>
                  <Download className="size-3" />
                </a>
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => onCopy(asset.path, asset.id)}>
                {copied === asset.id ? <Check className="size-3" /> : <Copy className="size-3" />}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
