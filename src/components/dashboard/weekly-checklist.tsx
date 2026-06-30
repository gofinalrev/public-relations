"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

type WeeklyChecklistProps = {
  hasPdf: boolean;
  postsLogged: number;
  className?: string;
};

const STEPS = [
  {
    id: "pdf",
    title: "Import Metricool PDF",
    detail: "Period tab → drag the Monday Social Media Insights export.",
  },
  {
    id: "posts",
    title: "Log top post stats",
    detail: "Period tab → Post performance → add views from YouTube Studio / IG Insights.",
  },
  {
    id: "review",
    title: "Review priority actions",
    detail: "Overview tab → check recommended next steps for the week.",
  },
] as const;

export function WeeklyChecklist({ hasPdf, postsLogged, className }: WeeklyChecklistProps) {
  const done = {
    pdf: hasPdf,
    posts: postsLogged > 0,
    review: hasPdf && postsLogged > 0,
  };

  const completedCount = Object.values(done).filter(Boolean).length;

  return (
    <Card className={cn("border-primary/20 bg-primary/[0.02]", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Monday checklist</CardTitle>
        <CardDescription>
          {completedCount === STEPS.length
            ? "This week is logged. Insights and email brief will use this data."
            : `${completedCount}/${STEPS.length} done — about 10 minutes each Monday.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {STEPS.map((step) => {
          const isDone = done[step.id as keyof typeof done];
          const Icon = isDone ? CheckCircle2 : Circle;
          return (
            <div
              key={step.id}
              className={cn(
                "flex gap-2.5 rounded-md border border-foreground/[0.06] p-3 text-sm",
                isDone && "bg-muted/25",
              )}
            >
              <Icon
                className={cn("mt-0.5 size-4 shrink-0", isDone ? "text-primary" : "text-muted-foreground")}
              />
              <div>
                <p className={cn("font-medium", isDone && "text-muted-foreground line-through")}>
                  {step.title}
                </p>
                {!isDone && <p className="mt-0.5 text-xs text-muted-foreground">{step.detail}</p>}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
