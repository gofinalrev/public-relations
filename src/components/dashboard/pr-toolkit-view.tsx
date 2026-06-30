"use client";

import { useState } from "react";
import type { Channel, WeeklyReport } from "@/lib/db";
import type { DashboardPeriodContext } from "@/lib/period-context";
import { parseCaptionStudioState } from "@/lib/caption-studio/state";
import { cn } from "@/lib/utils";
import { BrandAssetsPanel } from "./pr-toolkit/brand-assets-panel";
import { LinksAndProfilesPanel } from "./pr-toolkit/links-and-profiles-panel";
import { CopyBlocksPanel } from "./pr-toolkit/copy-blocks-panel";
import { ContentIdeasPanel } from "./pr-toolkit/content-ideas-panel";
import { ProductCheatsheetPanel } from "./pr-toolkit/product-cheatsheet-panel";
import { CaptionStudioPanel } from "./pr-toolkit/caption-studio-panel";
import { Image, Link2, MessageSquare, Lightbulb, BookOpen, Sparkles } from "lucide-react";

type PrToolkitViewProps = {
  weekStart: string;
  report: WeeklyReport | null;
  channels: Channel[];
  context: DashboardPeriodContext;
  geminiConfigured: boolean;
};

const SECTIONS = [
  { id: "captions", label: "Captions", icon: Sparkles },
  { id: "ideas", label: "Ideas", icon: Lightbulb },
  { id: "copy", label: "Copy", icon: MessageSquare },
  { id: "links", label: "Links", icon: Link2 },
  { id: "brand", label: "Assets", icon: Image },
  { id: "cheatsheet", label: "FAQ", icon: BookOpen },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export function PrToolkitView({
  weekStart,
  report,
  channels,
  context,
  geminiConfigured,
}: PrToolkitViewProps) {
  const [section, setSection] = useState<SectionId>("captions");

  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto border-b border-foreground/[0.08] pb-px">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const active = section === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={cn(
                "flex min-h-[44px] shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors sm:min-h-0",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              {s.label}
            </button>
          );
        })}
      </div>

      {section === "captions" && (
        <CaptionStudioPanel
          weekStart={weekStart}
          geminiConfigured={geminiConfigured}
          initialStudioState={parseCaptionStudioState(report?.caption_studio_json)}
        />
      )}
      {section === "ideas" && (
        <ContentIdeasPanel report={report} channels={channels} context={context} />
      )}
      {section === "copy" && <CopyBlocksPanel />}
      {section === "links" && <LinksAndProfilesPanel weekStart={weekStart} />}
      {section === "brand" && <BrandAssetsPanel />}
      {section === "cheatsheet" && <ProductCheatsheetPanel />}
    </div>
  );
}
