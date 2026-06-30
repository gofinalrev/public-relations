"use client";

import { useState } from "react";
import { getPlatformUtmLinks } from "@/lib/utm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlatformLogo } from "@/components/dashboard/platform-logo";
import { Link2, Copy, Check } from "lucide-react";

type UtmLinkGeneratorProps = {
  weekStart: string;
};

export function UtmLinkGenerator({ weekStart }: UtmLinkGeneratorProps) {
  const links = getPlatformUtmLinks(weekStart);
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(url: string, key: string) {
    await navigator.clipboard.writeText(url);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="size-5 text-primary-700" />
          UTM links for bios & descriptions
        </CardTitle>
        <CardDescription>
          Copy into each platform bio so PostHog can attribute traffic (reduces &quot;direct&quot; visits).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {links.map((link) => (
          <div key={link.platform} className="flex items-center gap-3 border border-border p-2">
            <PlatformLogo platformOrSlug={link.platform} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium">{link.label}</p>
              <p className="truncate text-[11px] text-muted-foreground">{link.url}</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="shrink-0"
              onClick={() => copy(link.url, link.platform)}
            >
              {copied === link.platform ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
