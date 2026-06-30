"use client";

import type { Channel, WeeklyReport } from "@/lib/db";
import type { DashboardPeriodContext } from "@/lib/period-context";
import { resolveChannelGoal, type ResolvedChannelGoal } from "@/lib/channel-goals";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatNumber, cn } from "@/lib/utils";
import { computeGoalVelocity } from "@/lib/utm";
import { saveChannel } from "@/app/actions";
import { PlatformLogo } from "@/components/dashboard/platform-logo";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const statusConfig = {
  active: { label: "Active", variant: "default" as const, icon: Clock },
  setup_needed: { label: "Setup needed", variant: "warning" as const, icon: AlertCircle },
  planned: { label: "Planned", variant: "secondary" as const, icon: Clock },
  achieved: { label: "Achieved", variant: "success" as const, icon: CheckCircle2 },
};

type ChannelGoalsProps = {
  channels: Channel[];
  report: WeeklyReport | null;
  periodContext: DashboardPeriodContext;
  youtubeApiEnabled: boolean;
};

export function ChannelGoals({ channels, report, periodContext, youtubeApiEnabled }: ChannelGoalsProps) {
  let breakdown: { periodDays?: number; extras?: { youtubeSubsGained?: number } } | null = null;
  if (report?.metricool_breakdown_json) {
    try {
      breakdown = JSON.parse(report.metricool_breakdown_json);
    } catch {
      breakdown = null;
    }
  }

  const milestoneChannels = channels.filter((c) => c.platform !== "web");
  const periodChannels = channels.filter((c) => c.platform === "web");

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Social · all-time
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {milestoneChannels.map((channel) => (
            <ChannelGoalCard
              key={channel.slug}
              channel={channel}
              resolved={resolveChannelGoal(channel, report, periodContext)}
              youtubeApiEnabled={youtubeApiEnabled}
              youtubeSubsGained={channel.slug === "youtube" ? (breakdown?.extras?.youtubeSubsGained ?? null) : null}
              periodDays={breakdown?.periodDays ?? periodContext.periodDays}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Tooltrace.ai · {periodContext.activityLabel}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {periodChannels
            .filter((c) => c.slug === "tooltrace-web")
            .map((channel) => (
              <ChannelGoalCard
                key={channel.slug}
                channel={channel}
                resolved={resolveChannelGoal(channel, report, periodContext)}
                youtubeApiEnabled={youtubeApiEnabled}
                youtubeSubsGained={null}
                periodDays={periodContext.periodDays}
              />
            ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          finalREV.com · {periodContext.activityLabel}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {periodChannels
            .filter((c) => c.slug === "finalrev-web")
            .map((channel) => (
            <ChannelGoalCard
              key={channel.slug}
              channel={channel}
              resolved={resolveChannelGoal(channel, report, periodContext)}
              youtubeApiEnabled={youtubeApiEnabled}
              youtubeSubsGained={null}
              periodDays={periodContext.periodDays}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

type SaveState = "idle" | "saving" | "saved" | "error";

function ChannelGoalCard({
  channel,
  resolved,
  youtubeApiEnabled,
  youtubeSubsGained,
  periodDays,
}: {
  channel: Channel;
  resolved: ResolvedChannelGoal;
  youtubeApiEnabled: boolean;
  youtubeSubsGained: number | null;
  periodDays: number | null;
}) {
  const router = useRouter();
  const isMilestone = resolved.scope === "milestone";
  const [inputValue, setInputValue] = useState(String(channel.current_value));
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (isMilestone) {
      setInputValue(String(channel.current_value));
    }
  }, [channel.current_value, isMilestone]);

  useEffect(() => {
    if (saveState !== "saved") return;
    const timer = window.setTimeout(() => setSaveState("idle"), 3000);
    return () => window.clearTimeout(timer);
  }, [saveState]);

  const status = statusConfig[resolved.displayStatus];
  const StatusIcon = status.icon;
  const isYoutubeApi = channel.slug === "youtube" && youtubeApiEnabled;
  const isRedditApi = channel.slug === "reddit";
  const manualEditable = isMilestone && resolved.displayStatus !== "achieved";
  const autoSyncedMilestone = isMilestone && (isYoutubeApi || isRedditApi);

  const velocity =
    isMilestone && channel.slug === "youtube" && youtubeSubsGained
      ? computeGoalVelocity(resolved.displayValue, resolved.displayTarget, youtubeSubsGained, periodDays)
      : isMilestone
        ? computeGoalVelocity(resolved.displayValue, resolved.displayTarget, null, null)
        : null;

  async function handleSubmit(formData: FormData) {
    setSaveState("saving");
    setSaveError(null);
    try {
      const result = await saveChannel(formData);
      if (!result.ok) {
        setSaveState("error");
        setSaveError(result.error ?? "Could not save");
        return;
      }
      setInputValue(String(result.current_value));
      setSaveState("saved");
      router.refresh();
    } catch {
      setSaveState("error");
      setSaveError("Save failed. Try again.");
    }
  }

  const parsedInput = Number(inputValue);
  const inputDirty = isMilestone && inputValue !== "" && parsedInput !== channel.current_value;

  return (
    <form
      action={(formData) => {
        void handleSubmit(formData);
      }}
      className={cn(
        "border border-foreground/[0.08] bg-card/80 p-4 backdrop-blur-sm transition-all hover:border-foreground/[0.12]",
        saveState === "saved" && "border-emerald-500/40 ring-1 ring-emerald-500/20",
        saveState === "error" && "border-destructive/40 ring-1 ring-destructive/20",
        !isMilestone && !resolved.hasPeriodData && "border-dashed opacity-90",
      )}
    >
      <input type="hidden" name="slug" value={channel.slug} />
      <input type="hidden" name="status" value={channel.status} />
      <input type="hidden" name="notes" value={channel.notes} />

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <PlatformLogo
            platformOrSlug={
              channel.slug === "tooltrace-web" || channel.slug === "finalrev-web" ? channel.slug : channel.platform
            }
            name={channel.name}
            size="lg"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold">{channel.name}</p>
              {channel.profile_url && (
                <a
                  href={channel.profile_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-700 hover:text-primary-800"
                  aria-label={`Open ${channel.name}`}
                >
                  <ExternalLink className="size-3" />
                </a>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{channel.goal_label}</p>
            <p className="text-[10px] text-muted-foreground/80">{resolved.scopeHint}</p>
          </div>
        </div>
        <Badge variant={status.variant} className="shrink-0 gap-1">
          <StatusIcon className="size-3" />
          {status.label}
        </Badge>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{channel.goal_metric}</span>
          <span className="font-medium tabular-nums">
            {formatNumber(resolved.displayValue)} / {formatNumber(resolved.displayTarget)}
            <span className="ml-1 font-normal text-muted-foreground">({resolved.valueCaption})</span>
          </span>
        </div>
        <Progress value={resolved.progressPct} className={cn(resolved.displayStatus === "achieved" && "opacity-80")} />
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">{resolved.targetCaption}</span>
          <span className="font-medium tabular-nums text-primary-700">{resolved.progressPct.toFixed(0)}%</span>
        </div>
        {velocity && resolved.displayStatus !== "achieved" && (
          <p className="text-[11px] text-muted-foreground">{velocity}</p>
        )}
      </div>

      {!isMilestone && !resolved.hasPeriodData && (
        <p className="mt-3 text-[11px] text-amber-700 dark:text-amber-400">
          No data yet for this period. PostHog syncs on page load, or import a Metricool PDF.
        </p>
      )}

      {manualEditable && (
        <div className="mt-3 space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              name="current_value"
              type="number"
              min={0}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Current total"
              className="h-10 text-xs tabular-nums sm:h-8"
              disabled={saveState === "saving"}
            />
            <Button
              type="submit"
              size="sm"
              variant={saveState === "saved" ? "default" : "secondary"}
              disabled={saveState === "saving" || (!inputDirty && saveState !== "error")}
              className={cn(
                "min-h-[44px] w-full min-w-[5.5rem] shrink-0 sm:min-h-0 sm:w-auto",
                saveState === "saved" && "bg-emerald-600 text-white hover:bg-emerald-600",
              )}
            >
              {saveState === "saving" && <Loader2 className="size-3 animate-spin" />}
              {saveState === "saved" && <CheckCircle2 className="size-3" />}
              {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Update"}
            </Button>
          </div>
          {inputDirty && saveState === "idle" && (
            <p className="text-[11px] text-muted-foreground">Latest all-time count, then Update.</p>
          )}
          {saveState === "saved" && (
            <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              Saved {formatNumber(parsedInput)} {channel.goal_metric} (all-time).
            </p>
          )}
          {saveState === "error" && saveError && (
            <p className="text-[11px] font-medium text-destructive">{saveError}</p>
          )}
        </div>
      )}

      {(autoSyncedMilestone || !isMilestone) && resolved.syncSource && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          {isYoutubeApi && "YouTube API"}
          {isRedditApi && !isYoutubeApi && "Reddit API"}
          {!isYoutubeApi && !isRedditApi && resolved.syncSource}
        </p>
      )}

      {channel.notes && (
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{channel.notes}</p>
      )}
    </form>
  );
}
