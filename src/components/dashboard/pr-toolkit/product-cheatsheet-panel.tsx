"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformLogo } from "@/components/dashboard/platform-logo";
import { Copy, Check } from "lucide-react";
import {
  FAQ_SECTIONS,
  FAQ_PRODUCT_LABEL,
  type FaqEntry,
} from "@/lib/pr-toolkit/product-faq";

type SectionFilter = "all" | "both" | "tooltrace" | "finalrev";

const FILTER_OPTIONS: Array<{ id: SectionFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "tooltrace", label: "Tooltrace" },
  { id: "finalrev", label: "finalREV" },
  { id: "both", label: "Both products" },
];

export function ProductCheatsheetPanel() {
  const [copied, setCopied] = useState<string | null>(null);
  const [filter, setFilter] = useState<SectionFilter>("all");

  async function copy(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const visibleSections =
    filter === "all"
      ? FAQ_SECTIONS
      : FAQ_SECTIONS.filter((section) => section.id === filter);

  const totalCount = visibleSections.reduce((n, s) => n + s.items.length, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Product FAQ for comments & DMs</CardTitle>
        <CardDescription>
          {totalCount} answers sourced from tooltrace.ai and finalrev.com — copy when replying on social
        </CardDescription>
        <div className="flex flex-wrap gap-1.5 pt-2">
          {FILTER_OPTIONS.map((opt) => (
            <Button
              key={opt.id}
              type="button"
              size="sm"
              variant={filter === opt.id ? "default" : "secondary"}
              onClick={() => setFilter(opt.id)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {visibleSections.map((section) => (
          <FaqSection
            key={section.id}
            sectionId={section.id}
            title={section.title}
            description={section.description}
            items={section.items}
            copied={copied}
            onCopy={copy}
            showHeader={filter === "all"}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function FaqSection({
  sectionId,
  title,
  description,
  items,
  copied,
  onCopy,
  showHeader,
}: {
  sectionId: "both" | "tooltrace" | "finalrev";
  title: string;
  description: string;
  items: FaqEntry[];
  copied: string | null;
  onCopy: (text: string, id: string) => void;
  showHeader: boolean;
}) {
  const brandLogo = sectionId === "both" ? null : sectionId;

  return (
    <section className="space-y-3">
      {showHeader && (
        <div className="border-b border-foreground/[0.08] pb-2">
          <div className="flex items-center gap-2">
            {brandLogo && <PlatformLogo platformOrSlug={brandLogo} size="sm" />}
            <h3 className="text-sm font-semibold">{title}</h3>
            <Badge variant="secondary" className="text-[10px] font-normal">
              {items.length}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item, i) => {
          const copyId = `${sectionId}-${i}`;
          return (
            <div key={item.q} className="border border-foreground/[0.08] p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {!showHeader && (
                    <Badge variant="outline" className="mb-1.5 text-[10px] font-normal">
                      {FAQ_PRODUCT_LABEL[item.product]}
                    </Badge>
                  )}
                  <p className="text-sm font-semibold">{item.q}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  title="Copy answer"
                  onClick={() => onCopy(item.a, copyId)}
                >
                  {copied === copyId ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                </Button>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{item.a}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
