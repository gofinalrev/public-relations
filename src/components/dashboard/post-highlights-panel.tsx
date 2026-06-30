"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  type PostHighlight,
  analyzePostHighlights,
  parsePostHighlights,
  platformLabel,
} from "@/lib/post-highlights";
import { savePostHighlights } from "@/app/post-highlights-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PlatformLogo } from "@/components/dashboard/platform-logo";
import { resolvePostUrl } from "@/lib/post-url";
import { formatNumber, cn } from "@/lib/utils";
import { Clapperboard, Plus, Loader2, TrendingUp, ExternalLink } from "lucide-react";

import type { PostAutopsy } from "@/lib/intelligence/types";

type PostHighlightsPanelProps = {
  weekStart: string;
  postHighlightsJson: string | null | undefined;
  compact?: boolean;
  autopsies?: PostAutopsy[];
};

export function PostHighlightsPanel({ weekStart, postHighlightsJson, compact, autopsies = [] }: PostHighlightsPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const posts = parsePostHighlights(postHighlightsJson);
  const insights = analyzePostHighlights(posts);

  function addPost(formData: FormData) {
    const title = (formData.get("title") as string)?.trim();
    const platform = formData.get("platform") as PostHighlight["platform"];
    const views = Number(formData.get("views"));
    const likes = Number(formData.get("likes") || 0);
    const publishedAt = (formData.get("publishedAt") as string)?.trim() || undefined;
    const format = (formData.get("format") as PostHighlight["format"]) || undefined;
    const groupId = (formData.get("groupId") as string)?.trim() || undefined;
    const url = (formData.get("url") as string)?.trim() || undefined;
    const experiment = (formData.get("experiment") as string)?.trim() || undefined;
    const product = (formData.get("product") as PostHighlight["product"]) || "finalrev";

    if (!title || !platform || !Number.isFinite(views)) return;

    const next: PostHighlight = {
      id: `${platform}-${Date.now()}`,
      platform,
      format,
      title,
      views,
      likes,
      publishedAt,
      product,
      groupId: groupId || undefined,
      url,
      experiment,
    };

    startTransition(async () => {
      await savePostHighlights(weekStart, [...posts, next]);
      setShowForm(false);
      router.refresh();
    });
  }

  if (compact && posts.length === 0) return null;

  return (
    <Card className="border-foreground/[0.08]">
      <CardHeader className={compact ? "pb-2" : "pb-3"}>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clapperboard className="size-5 text-primary" />
          {compact ? "Top posts" : "Post performance"}
        </CardTitle>
        {!compact && (
          <CardDescription>
            Manual entry from YouTube Studio / IG Insights. Tag product: finalREV (default) or Tooltrace when clips target that brand.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {posts.length > 0 ? (
          <ul className="space-y-2">
            {[...posts]
              .sort((a, b) => b.views - a.views)
              .map((post) => (
                <PostHighlightRow
                  key={post.id}
                  post={post}
                  compact={compact}
                  autopsy={autopsies.find((a) => a.postId === post.id)}
                />
              ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No posts logged. Add stats from YouTube Studio or IG Insights.</p>
        )}

        {insights.length > 0 && !compact && (
          <div className="space-y-2 border-t border-foreground/[0.06] pt-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <TrendingUp className="size-3.5" />
              From this week&apos;s posts
            </p>
            {insights.map((insight) => (
              <div key={insight.title} className="border border-foreground/[0.06] bg-card/50 p-3 text-sm">
                <p className="font-medium">{insight.title}</p>
                <p className="mt-0.5 text-muted-foreground">{insight.body}</p>
              </div>
            ))}
          </div>
        )}

        {!compact && (
          <>
            {showForm ? (
              <form action={addPost} className="grid gap-3 border border-dashed border-foreground/15 p-3 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" placeholder="Robots meet Machinery" required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="platform">Platform</Label>
                  <select
                    id="platform"
                    name="platform"
                    className="flex h-10 w-full border border-input bg-background px-3 text-sm"
                    required
                  >
                    <option value="youtube">YouTube</option>
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="x">X</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="format">Format</Label>
                  <select id="format" name="format" className="flex h-10 w-full border border-input bg-background px-3 text-sm">
                    <option value="short">Short</option>
                    <option value="reel">Reel</option>
                    <option value="post">Post</option>
                    <option value="video">Video</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="product">Product</Label>
                  <select
                    id="product"
                    name="product"
                    defaultValue="finalrev"
                    className="flex h-10 w-full border border-input bg-background px-3 text-sm"
                  >
                    <option value="finalrev">finalREV (shop-floor)</option>
                    <option value="tooltrace">Tooltrace</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="views">Views</Label>
                  <Input id="views" name="views" type="number" min={0} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="likes">Likes</Label>
                  <Input id="likes" name="likes" type="number" min={0} defaultValue={0} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="publishedAt">Published (YYYY-MM-DD)</Label>
                  <Input id="publishedAt" name="publishedAt" type="date" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="groupId">Cross-post group (optional)</Label>
                  <Input id="groupId" name="groupId" placeholder="robots-short" />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="experiment">Experiment tag (optional)</Label>
                  <Input id="experiment" name="experiment" placeholder="Pinned finalrev.com/quote in comment" />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="url">Post URL (optional)</Label>
                  <Input
                    id="url"
                    name="url"
                    type="url"
                    placeholder="https://youtube.com/shorts/..."
                  />
                </div>
                <div className="flex gap-2 sm:col-span-2">
                  <Button type="submit" disabled={pending}>
                    {pending && <Loader2 className="size-3.5 animate-spin" />}
                    Save post
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm(true)}>
                <Plus className="size-3.5" />
                Add post stats
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function PostHighlightRow({
  post,
  compact,
  autopsy,
}: {
  post: PostHighlight;
  compact?: boolean;
  autopsy?: PostAutopsy;
}) {
  const url = resolvePostUrl(post);
  const rowClass = cn(
    "flex items-start gap-3 border border-foreground/[0.08] bg-muted/20 p-3 transition-colors",
    url && "group cursor-pointer hover:border-primary/25 hover:bg-muted/35",
  );

  const inner = (
    <>
      <PlatformLogo platformOrSlug={post.platform} size={compact ? "sm" : "md"} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-sm font-semibold group-hover:text-primary">{post.title}</p>
          {!compact && post.format && (
            <Badge variant="outline" className="text-[9px] font-normal capitalize">
              {post.format}
            </Badge>
          )}
          {!compact && post.product && (
            <Badge variant="secondary" className="text-[9px] font-normal capitalize">
              {post.product}
            </Badge>
          )}
          {post.experiment && (
            <Badge variant="outline" className="text-[9px] font-normal">
              exp
            </Badge>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {platformLabel(post.platform)} · {formatNumber(post.views)} views
          {!compact && ` · ${post.likes} likes`}
          {!compact && post.publishedAt ? ` · ${post.publishedAt}` : ""}
        </p>
        {!compact && post.notes && (
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{post.notes}</p>
        )}
        {!compact && autopsy && (
          <div className="mt-2 border-l-2 border-amber-500/50 pl-2 text-[11px]">
            <p className="font-medium text-amber-700 dark:text-amber-400">Possible reasons</p>
            <ul className="mt-0.5 list-disc pl-4 text-muted-foreground">
              {autopsy.reasons.slice(0, 2).map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <p className="mt-1 text-primary">{autopsy.fixes[0]}</p>
          </div>
        )}
      </div>
      {!compact && (
        <p className="text-lg font-bold tabular-nums text-primary">{formatNumber(post.views)}</p>
      )}
      {url && (
        <ExternalLink
          className="mt-0.5 size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-70"
          aria-hidden
        />
      )}
    </>
  );

  if (url) {
    return (
      <li>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={rowClass}
          title={`Open on ${platformLabel(post.platform)}`}
        >
          {inner}
        </a>
      </li>
    );
  }

  return <li className={rowClass}>{inner}</li>;
}
