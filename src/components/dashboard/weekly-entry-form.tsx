"use client";

import type { WeeklyReport } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { saveWeeklyReport } from "@/app/actions";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, Lightbulb, Lock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type WeeklyEntryFormProps = {
  weekStart: string;
  report: WeeklyReport | null;
  autoSynced?: boolean;
};

const emptyReport = (weekStart: string): WeeklyReport => ({
  id: 0,
  week_start: weekStart,
  metricool_video_views: 0,
  metricool_engagement: 0,
  posthog_visitors: 0,
  posthog_subscriptions: 0,
  learning: "",
  locked_findings: "",
  posthog_insights: "",
  posthog_funnel_json: "",
  posthog_synced_at: null,
  metricool_breakdown_json: "",
  metricool_synced_at: null,
  growth_insights: "",
  action_items_json: "[]",
  caption_studio_json: "{}",
  post_highlights_json: "{}",
  intelligence_json: "",
  created_at: "",
  updated_at: "",
});

export function WeeklyEntryForm({ weekStart, report, autoSynced }: WeeklyEntryFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const data = report ?? emptyReport(weekStart);

  useEffect(() => {
    if (!saved) return;
    const t = window.setTimeout(() => setSaved(false), 3000);
    return () => window.clearTimeout(t);
  }, [saved]);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      await saveWeeklyReport(formData);
      setSaved(true);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      action={(formData) => {
        void handleSubmit(formData);
      }}
    >
      <input type="hidden" name="week_start" value={weekStart} />
      {autoSynced && (
        <>
          <input type="hidden" name="metricool_video_views" value={data.metricool_video_views} />
          <input type="hidden" name="metricool_engagement" value={data.metricool_engagement} />
          <input type="hidden" name="posthog_visitors" value={data.posthog_visitors} />
          <input type="hidden" name="posthog_subscriptions" value={data.posthog_subscriptions} />
        </>
      )}

      <Card className={cn(saved && "border-emerald-500/40 ring-1 ring-emerald-500/20")}>
        <CardHeader>
          <CardTitle>Reflection</CardTitle>
          <CardDescription>
            {autoSynced
              ? "Metrics sync automatically. Save what you learned this week."
              : "Import your social report first, then save your notes."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Lightbulb className="size-3.5 text-primary-700" />
              One-sentence learning
            </Label>
            <Textarea
              name="learning"
              defaultValue={data.learning}
              placeholder='e.g. "CAD vs AI on X drove traffic; ASMR edits got views, no subs."'
              rows={3}
              disabled={pending}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Lock className="size-3.5 text-primary-700" />
              Lock in findings
            </Label>
            <Textarea
              name="locked_findings"
              defaultValue={data.locked_findings}
              placeholder="Next week: continue, stop, or experiment with..."
              rows={3}
              disabled={pending}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={pending} className="w-full sm:w-auto">
              {pending && <Loader2 className="size-4 animate-spin" />}
              {pending ? "Saving…" : saved ? "Saved" : report ? "Save reflection" : "Save week"}
            </Button>
            {saved && (
              <span className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />
                Reflection saved
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
