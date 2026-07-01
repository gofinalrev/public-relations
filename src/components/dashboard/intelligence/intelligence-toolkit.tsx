"use client";

import { useState } from "react";
import type { WeeklyIntelligence } from "@/lib/intelligence/types";
import { buildPublishKit } from "@/lib/intelligence/publish-kit";
import { predictDraftPost } from "@/lib/intelligence/publish-predict";
import type { PostHighlight } from "@/lib/post-highlights";
import { platformLabel } from "@/lib/post-highlights";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";
import { BookOpen, Copy, Check, Layers, RefreshCw, Wand2 } from "lucide-react";

type IntelligenceToolkitProps = {
  intel: WeeklyIntelligence;
  weekStart: string;
  posts: PostHighlight[];
};

export function IntelligenceToolkit({ intel, weekStart, posts }: IntelligenceToolkitProps) {
  const topPost = posts.length ? [...posts].sort((a, b) => b.views - a.views)[0] : null;

  return (
    <div className="space-y-4">
      <HookLibraryPanel hooks={intel.hookLibrary} />
      <RepurposePanel plans={intel.repurposePlans} />
      {topPost && <PublishKitPanel post={topPost} weekStart={weekStart} />}
      <PredictPanel predictions={intel.publishPredictions} posts={posts} hookLibrary={intel.hookLibrary} />
    </div>
  );
}

function HookLibraryPanel({ hooks }: { hooks: WeeklyIntelligence["hookLibrary"] }) {
  if (hooks.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="size-5" />
            Hook library
          </CardTitle>
          <CardDescription>Log post stats to build a ranked hook library over time.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="size-5 text-primary" />
          Hook library
        </CardTitle>
        <CardDescription>Top hooks by average views</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {hooks.map((h) => (
          <div key={h.id} className="flex items-start justify-between gap-2 border border-foreground/[0.06] p-3 text-sm">
            <div>
              <p className="font-semibold">&ldquo;{h.hook}&rdquo;</p>
              <p className="text-xs text-muted-foreground capitalize">
                {h.platform}{h.format ? ` · ${h.format}` : ""} · {h.appearances} post{h.appearances === 1 ? "" : "s"}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold tabular-nums text-primary">{formatNumber(h.avgViews)}</p>
              <Badge variant={h.status === "validated" ? "default" : "secondary"} className="mt-1 text-[9px]">
                {h.status}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function RepurposePanel({ plans }: { plans: WeeklyIntelligence["repurposePlans"] }) {
  if (plans.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <RefreshCw className="size-5 text-primary" />
          Cross-post suggestions
        </CardTitle>
        <CardDescription>Cross-post top performers to lagging platforms</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {plans.map((plan) => (
          <div key={plan.groupId} className="border border-foreground/[0.06] p-3 text-sm">
            <p className="font-semibold">
              Source: {plan.sourceTitle} ({platformLabel(plan.sourcePlatform)})
            </p>
            <ul className="mt-2 space-y-1.5">
              {plan.targets.map((t) => (
                <li key={t.platform} className="text-muted-foreground">
                  <span className="font-medium text-foreground">{platformLabel(t.platform)}:</span> {t.captionAngle}
                  {t.coverNote && <span className="block text-xs">{t.coverNote}</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function PublishKitPanel({ post, weekStart }: { post: PostHighlight; weekStart: string }) {
  const kit = buildPublishKit(post, weekStart);
  const [copied, setCopied] = useState<string | null>(null);

  async function copyStep(platform: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(platform);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="size-5 text-primary" />
          Multi-platform publish checklist
        </CardTitle>
        <CardDescription>
          {kit.postOrderSummary} · from &ldquo;{kit.title}&rdquo;
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {kit.steps.map((step) => (
          <div key={step.platform} className="border border-foreground/[0.06] p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="outline" className="capitalize">{platformLabel(step.platform)}</Badge>
              <Button size="sm" variant="ghost" className="h-7" onClick={() => void copyStep(step.platform, `${step.caption}\n\n${step.utmUrl}`)}>
                {copied === step.platform ? <Check className="size-3" /> : <Copy className="size-3" />}
              </Button>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{step.caption}</p>
            <p className="mt-1 text-[10px] text-primary">{step.notes}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function PredictPanel({
  predictions,
  posts,
  hookLibrary,
}: {
  predictions: WeeklyIntelligence["publishPredictions"];
  posts: PostHighlight[];
  hookLibrary: WeeklyIntelligence["hookLibrary"];
}) {
  const [draft, setDraft] = useState("");
  const [platform, setPlatform] = useState<PostHighlight["platform"]>("youtube");

  const draftPrediction =
    draft.trim().length > 3 ? predictDraftPost(draft, platform, hookLibrary, posts) : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wand2 className="size-5 text-primary" />
          Draft view range
        </CardTitle>
        <CardDescription>Rough range from logged posts only — not a forecast</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="flex h-9 flex-1 border border-input bg-background px-3 text-sm"
            placeholder="Draft title or hook..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <select
            className="h-9 border border-input bg-background px-2 text-sm capitalize"
            value={platform}
            onChange={(e) => setPlatform(e.target.value as PostHighlight["platform"])}
          >
            {(["youtube", "instagram", "tiktok", "x", "linkedin"] as const).map((p) => (
              <option key={p} value={p}>{platformLabel(p)}</option>
            ))}
          </select>
        </div>
        {draftPrediction && (
          <div className="rounded-md border border-foreground/[0.08] bg-muted/20 p-3 text-sm">
            <p>
              Logged-post range: <strong>{formatNumber(draftPrediction.viewsLow)}–{formatNumber(draftPrediction.viewsHigh)}</strong> views ({platformLabel(draftPrediction.platform)})
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Based on {posts.length} logged post{posts.length === 1 ? "" : "s"}. Not verified against platform analytics.
            </p>
          </div>
        )}
        {predictions.slice(0, 3).map((p) => (
          <div key={`${p.platform}-${p.postTitle}`} className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{p.postTitle}</span>: {formatNumber(p.viewsLow)}–{formatNumber(p.viewsHigh)} views (logged-post range)
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
