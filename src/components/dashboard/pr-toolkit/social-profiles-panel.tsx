"use client";

import { useState } from "react";
import { SOCIAL_PLATFORMS, SOCIAL_PLATFORM_SLUGS } from "@/lib/platforms";
import { KEY_URLS, CHANNEL_BIO_PRODUCT } from "@/lib/pr-toolkit/brand-assets";
import { PRODUCT_URLS } from "@/lib/product-labels";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformLogo } from "@/components/dashboard/platform-logo";
import { Copy, Check, ExternalLink } from "lucide-react";

type SocialProfilesPanelProps = {
  variant: "full" | "urls-only";
};

function bioLinkHint(slug: string): string {
  const product = CHANNEL_BIO_PRODUCT[slug];
  if (!product) return "";
  return product === "finalrev" ? "Link bio → finalrev.com/quote" : "Link bio → tooltrace.ai/designer";
}

export function SocialProfilesPanel({ variant }: SocialProfilesPanelProps) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  if (variant === "urls-only") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product URLs</CardTitle>
          <CardDescription>
            Deep links for CTAs with UTMs. Tooltrace for product posts, finalREV for shop-floor and B2B.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {KEY_URLS.map((item) => (
            <div key={item.url} className="flex items-center gap-2 border border-foreground/[0.08] p-2">
              <PlatformLogo platformOrSlug={item.product} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-xs font-medium">{item.label}</p>
                  <Badge variant="outline" className="text-[9px] font-normal capitalize">
                    {item.product}
                  </Badge>
                </div>
                <p className="truncate text-[11px] text-muted-foreground">{item.url}</p>
              </div>
              <Button type="button" size="sm" variant="ghost" asChild>
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-3.5" />
                </a>
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => copy(item.url, item.url)}>
                {copied === item.url ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">@gofinalrev profiles</CardTitle>
        <CardDescription>
          Shared social handle. Link bios to Tooltrace (demos) or finalREV (quotes) per platform.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        {SOCIAL_PLATFORM_SLUGS.map((slug) => {
          const p = SOCIAL_PLATFORMS[slug];
          const product = CHANNEL_BIO_PRODUCT[slug];
          const suggestedUrl =
            product === "finalrev" ? PRODUCT_URLS.finalrev.quote : PRODUCT_URLS.tooltrace.designer;
          return (
            <div key={slug} className="flex items-center gap-3 border border-foreground/[0.08] p-3">
              <PlatformLogo platformOrSlug={slug} name={p.name} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-sm font-semibold">{p.name}</p>
                  {product && (
                    <Badge variant="outline" className="text-[9px] font-normal capitalize">
                      → {product}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{p.handle}</p>
                <p className="mt-0.5 text-[10px] text-primary-700 dark:text-primary/80">{bioLinkHint(slug)}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <Button type="button" size="sm" variant="ghost" asChild>
                  <a href={p.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-3.5" />
                  </a>
                </Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => copy(p.url, slug)}>
                  {copied === slug ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-[10px]"
                  onClick={() => copy(suggestedUrl, `${slug}-cta`)}
                  title="Copy suggested product URL"
                >
                  {copied === `${slug}-cta` ? <Check className="size-3" /> : "CTA"}
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
