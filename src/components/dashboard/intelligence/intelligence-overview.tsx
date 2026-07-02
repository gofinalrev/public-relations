"use client";

import type { WeeklyIntelligence } from "@/lib/intelligence/types";
import type { ReportMetricQuality } from "@/lib/metric-trust";
import { resolveProSubsDisplay } from "@/lib/metric-trust";
import { parallelTracksNote } from "@/lib/intelligence/content-focus";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import {
  BarChart3,
  GitBranch,
  ListChecks,
  Target,
} from "lucide-react";

export function IntelligenceOverview({
  intel,
  metricQuality,
}: {
  intel: WeeklyIntelligence;
  metricQuality: ReportMetricQuality;
}) {
  const proSubs = resolveProSubsDisplay(intel.contentPnl.proSubs, metricQuality);

  return (
    <div className="space-y-4">
      <ContentPnlCard pnl={intel.contentPnl} proSubs={proSubs} />
      <FunnelStoryCard story={intel.funnelStory} />
      <MondayQueueCard queue={intel.mondayQueue} />
      <CompetitivePulseCard pulse={intel.competitivePulse} />
      <Card className="border-dashed border-foreground/[0.12]">
        <CardContent className="py-3 text-sm text-muted-foreground">
          {parallelTracksNote("finalrev")}
        </CardContent>
      </Card>
      {intel.playbook.length > 0 && <PlaybookCard entries={intel.playbook} />}
    </div>
  );
}

function ContentPnlCard({
  pnl,
  proSubs,
}: {
  pnl: WeeklyIntelligence["contentPnl"];
  proSubs: ReturnType<typeof resolveProSubsDisplay>;
}) {
  return (
    <Card className="border-primary/25 bg-primary/[0.03]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="size-5 text-primary" />
          This period
        </CardTitle>
        <CardDescription className="text-sm font-medium text-foreground">{pnl.headline}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <PnlStat label="Social views" value={formatNumber(pnl.socialViews)} source="Metricool PDF" />
          <PnlStat label="Tooltrace visitors" value={formatNumber(pnl.tooltraceVisitors)} source="PostHog" />
          <PnlStat label="Pro subs" value={proSubs.displayValue} source={proSubs.sublabel} unavailable={proSubs.unavailable} />
          <PnlStat label="STEP uploads" value={String(pnl.stepUploads)} source="PostHog · finalrev.com" />
        </div>
        {pnl.bestRoiClip && (
          <p className="mt-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Top logged post:</span> {pnl.bestRoiClip}
          </p>
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Next:</span> {pnl.nextStep}
        </p>
      </CardContent>
    </Card>
  );
}

function PnlStat({
  label,
  value,
  source,
  unavailable,
}: {
  label: string;
  value: string;
  source?: string;
  unavailable?: boolean;
}) {
  return (
    <div className="border border-foreground/[0.06] bg-card/50 p-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums ${unavailable ? "text-muted-foreground" : ""}`}>{value}</p>
      {source && <p className="mt-0.5 text-[10px] text-muted-foreground">{source}</p>}
    </div>
  );
}

function FunnelStoryCard({ story }: { story: WeeklyIntelligence["funnelStory"] }) {
  const socialSteps = story.steps.filter((s) => s.track === "social");
  const tooltraceSteps = story.steps.filter((s) => s.track === "tooltrace");
  const finalrevSteps = story.steps.filter((s) => s.track === "finalrev");

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <GitBranch className="size-5 text-primary" />
          Metrics by source
        </CardTitle>
        <CardDescription>{story.narrative}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          <FunnelTrackGroup title="finalREV social" steps={socialSteps} />
          <FunnelTrackGroup title="Tooltrace site" steps={tooltraceSteps} />
          <FunnelTrackGroup title="finalREV quotes" steps={finalrevSteps} />
        </div>
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
  const showRate =
    step.rateFromPrev !== null &&
    step.label === "Tooltrace Pro" &&
    step.rateFromPrev !== null;

  return (
    <div className="border border-foreground/[0.08] bg-muted/20 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{step.label}</p>
      <p className="text-lg font-bold tabular-nums">{formatNumber(step.value)}</p>
      {showRate && (
        <p className="text-[10px] text-muted-foreground">
          {step.rateFromPrev!.toFixed(1)}% of Tooltrace visitors (PostHog)
        </p>
      )}
    </div>
  );
}

function MondayQueueCard({ queue }: { queue: WeeklyIntelligence["mondayQueue"] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ListChecks className="size-5 text-primary" />
          This week
        </CardTitle>
        <CardDescription>From logged data only</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {queue.map((item) => (
            <li key={item.priority} className="flex gap-3 text-sm">
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
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Working</p>
          <p className="mt-1">{pulse.yourStrength}</p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Gap</p>
          <p className="mt-1">{pulse.gap}</p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Try</p>
          <p className="mt-1 font-medium text-primary">{pulse.recommendation}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function PlaybookCard({ entries }: { entries: WeeklyIntelligence["playbook"] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Logged patterns</CardTitle>
        <CardDescription>From your post history — hypothesis until repeated across weeks</CardDescription>
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
