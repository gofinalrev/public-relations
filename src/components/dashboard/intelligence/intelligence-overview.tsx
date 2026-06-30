"use client";

import { useState } from "react";
import type { WeeklyIntelligence } from "@/lib/intelligence/types";
import { parallelTracksNote } from "@/lib/intelligence/content-focus";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";
import {
  ArrowDown,
  Copy,
  Check,
  Flame,
  DollarSign,
  GitBranch,
  FileText,
  ListChecks,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

export function IntelligenceOverview({ intel }: { intel: WeeklyIntelligence }) {
  return (
    <div className="space-y-4">
      {intel.warRoom?.active && <WarRoomBanner alert={intel.warRoom} />}
      <ContentPnlCard pnl={intel.contentPnl} />
      <FunnelStoryCard story={intel.funnelStory} />
      <div className="grid gap-4 lg:grid-cols-2">
        <BoardNarrativeCard narrative={intel.boardNarrative} />
        <MondayQueueCard queue={intel.mondayQueue} prescription={intel.prescription} />
      </div>
      <CompetitivePulseCard pulse={intel.competitivePulse} />
      {intel.clipAttribution.length === 0 && intel.funnelStory.mode !== "linked" && (
        <Card className="border-dashed border-foreground/[0.12]">
          <CardContent className="py-3 text-sm text-muted-foreground">
            {parallelTracksNote("finalrev")}
          </CardContent>
        </Card>
      )}
      {intel.clipAttribution.length > 0 && <ClipAttributionCard clips={intel.clipAttribution} />}
      {intel.playbook.length > 0 && <PlaybookCard entries={intel.playbook} />}
    </div>
  );
}

function WarRoomBanner({ alert }: { alert: NonNullable<WeeklyIntelligence["warRoom"]> }) {
  const [copied, setCopied] = useState(false);
  const hot = alert.severity === "hot";

  async function copyPinned() {
    await navigator.clipboard.writeText(`${alert.pinnedComment}\n${alert.utmLink}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className={hot ? "border-destructive/40 bg-destructive/5" : "border-amber-500/40 bg-amber-500/5"}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Flame className={`size-5 ${hot ? "text-destructive" : "text-amber-600"}`} />
          {alert.title}
        </CardTitle>
        <CardDescription>{alert.body}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-md border border-foreground/[0.08] bg-muted/30 p-3 text-sm">
          <p className="font-medium">Pinned comment</p>
          <p className="mt-1 text-muted-foreground">{alert.pinnedComment}</p>
        </div>
        <p className="text-sm text-muted-foreground">{alert.followUp}</p>
        <Button size="sm" variant="secondary" onClick={() => void copyPinned()}>
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          Copy comment + link
        </Button>
      </CardContent>
    </Card>
  );
}

function ContentPnlCard({ pnl }: { pnl: WeeklyIntelligence["contentPnl"] }) {
  return (
    <Card className="border-primary/25 bg-primary/[0.03]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="size-5 text-primary" />
          Content performance
        </CardTitle>
        <CardDescription className="text-sm font-medium text-foreground">{pnl.headline}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <PnlStat label="Social views" value={formatNumber(pnl.socialViews)} />
          <PnlStat label="Tooltrace visitors" value={formatNumber(pnl.tooltraceVisitors)} />
          <PnlStat label="Pro subs" value={String(pnl.proSubs)} />
          <PnlStat label="STEP uploads" value={String(pnl.stepUploads)} />
        </div>
        {pnl.bestRoiClip && (
          <p className="mt-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Top post:</span> {pnl.bestRoiClip}
          </p>
        )}
        <p className="mt-2 text-sm">
          <Zap className="mr-1 inline size-3.5 text-primary" />
          <span className="font-medium">Recommended next action:</span> {pnl.nextDollarMove}
        </p>
      </CardContent>
    </Card>
  );
}

function PnlStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-foreground/[0.06] bg-card/50 p-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function FunnelStoryCard({ story }: { story: WeeklyIntelligence["funnelStory"] }) {
  const parallel = story.mode !== "linked";
  const socialSteps = story.steps.filter((s) => s.track === "social");
  const tooltraceSteps = story.steps.filter((s) => s.track === "tooltrace");
  const finalrevSteps = story.steps.filter((s) => s.track === "finalrev");

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <GitBranch className="size-5 text-primary" />
          {parallel ? "Metrics by channel" : "Conversion funnel"}
        </CardTitle>
        <CardDescription>{story.narrative}</CardDescription>
      </CardHeader>
      <CardContent>
        {parallel ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <FunnelTrackGroup title="finalREV social" steps={socialSteps} />
            <FunnelTrackGroup title="Tooltrace site" steps={tooltraceSteps} />
            <FunnelTrackGroup title="finalREV quotes" steps={finalrevSteps} />
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            {story.steps.map((step, i) => (
              <div key={step.label} className="flex items-center gap-2">
                {i > 0 && <ArrowDown className="hidden size-4 rotate-[-90deg] text-muted-foreground sm:block" />}
                <FunnelStepBox step={step} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FunnelTrackGroup({
  title,
  steps,
}: {
  title: string;
  steps: WeeklyIntelligence["funnelStory"]["steps"];
}) {
  if (steps.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
      {steps.map((step) => (
        <FunnelStepBox key={step.label} step={step} />
      ))}
    </div>
  );
}

function FunnelStepBox({ step }: { step: WeeklyIntelligence["funnelStory"]["steps"][number] }) {
  return (
    <div className="border border-foreground/[0.08] bg-muted/20 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{step.label}</p>
      <p className="text-lg font-bold tabular-nums">{formatNumber(step.value)}</p>
      {step.rateFromPrev !== null && (
        <p className="text-[10px] text-primary">{step.rateFromPrev.toFixed(1)}% of prior step</p>
      )}
    </div>
  );
}

function BoardNarrativeCard({ narrative }: { narrative: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(narrative);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="size-5 text-primary" />
          Board narrative
        </CardTitle>
        <CardDescription>Copy for stakeholder update</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-relaxed text-muted-foreground">{narrative}</p>
        <Button size="sm" variant="outline" onClick={() => void copy()}>
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          Copy board paragraph
        </Button>
      </CardContent>
    </Card>
  );
}

function MondayQueueCard({
  queue,
  prescription,
}: {
  queue: WeeklyIntelligence["mondayQueue"];
  prescription: WeeklyIntelligence["prescription"];
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ListChecks className="size-5 text-primary" />
          Priority actions
        </CardTitle>
        <CardDescription>Ranked actions for this period</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
          <p><span className="font-semibold text-primary">Priority:</span> {prescription.doFirst}</p>
          <p className="text-muted-foreground"><span className="font-medium text-foreground">Deprioritize:</span> {prescription.ignore}</p>
          <p><span className="font-semibold">Weekly focus:</span> {prescription.betOfWeek}</p>
        </div>
        <ol className="space-y-2">
          {queue.map((item) => (
            <li key={item.priority} className="flex gap-2 text-sm">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                {item.priority}
              </span>
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-muted-foreground">{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function CompetitivePulseCard({ pulse }: { pulse: WeeklyIntelligence["competitivePulse"] }) {
  return (
    <Card className="border-foreground/[0.08]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="size-5 text-primary" />
          Channel comparison
        </CardTitle>
        <CardDescription>{pulse.headline}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3 text-sm">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Strength</p>
          <p className="mt-1">{pulse.yourStrength}</p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Gap</p>
          <p className="mt-1">{pulse.gap}</p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Recommendation</p>
          <p className="mt-1 font-medium text-primary">{pulse.recommendation}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ClipAttributionCard({ clips }: { clips: WeeklyIntelligence["clipAttribution"] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="size-5 text-primary" />
          Post-to-traffic attribution (Tooltrace posts only)
        </CardTitle>
        <CardDescription>Only shown when posts are tagged Tooltrace or both. finalREV shop-floor clips are not attributed to Tooltrace traffic.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {clips.map((clip) => (
          <div key={clip.postId} className="border border-foreground/[0.06] p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">{clip.title}</p>
              <Badge variant="secondary" className="text-[9px] capitalize">{clip.platform}</Badge>
            </div>
            <p className="mt-1 text-muted-foreground">
              {formatNumber(clip.views)} views · ~{formatNumber(clip.estimatedVisitors)} Tooltrace visitors
            </p>
            <p className="mt-0.5 text-xs text-primary">{clip.payoffNote}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function PlaybookCard({ entries }: { entries: WeeklyIntelligence["playbook"] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Recorded patterns</CardTitle>
        <CardDescription>Patterns from logged weeks and experiments</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {entries.slice(0, 5).map((e) => (
          <div key={e.id} className="border border-foreground/[0.06] p-3 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant={e.status === "validated" ? "default" : "secondary"} className="text-[9px]">
                {e.status}
              </Badge>
              <p className="font-medium">{e.title}</p>
            </div>
            <p className="mt-1 text-muted-foreground">{e.body}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
