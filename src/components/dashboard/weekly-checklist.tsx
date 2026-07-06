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
  { id: "pdf", title: "Import Metricool PDF", detail: "Drag the Monday export below." },
  { id: "posts", title: "Log top posts", detail: "Add views from YouTube Studio or IG Insights." },
] as const;

export function WeeklyChecklist({ hasPdf, postsLogged, className }: WeeklyChecklistProps) {
  const done = {
    pdf: hasPdf,
    posts: postsLogged > 0,
  };

  const completedCount = Object.values(done).filter(Boolean).length;
  const allDone = completedCount === STEPS.length;

  return (
    <Card className={cn("border-foreground/[0.08]", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Weekly tasks</CardTitle>
        <CardDescription>
          {allDone ? "Done for this period." : `${completedCount} of ${STEPS.length} complete.`}
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
                "flex gap-2.5 border border-foreground/[0.06] p-3 text-sm",
                isDone && "opacity-60",
              )}
            >
              <Icon
                className={cn("mt-0.5 size-4 shrink-0", isDone ? "text-primary" : "text-muted-foreground")}
              />
              <div>
                <p className={cn("font-medium", isDone && "line-through")}>{step.title}</p>
                {!isDone && <p className="mt-0.5 text-xs text-muted-foreground">{step.detail}</p>}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
