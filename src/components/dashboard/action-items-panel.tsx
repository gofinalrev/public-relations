"use client";

import { useTransition } from "react";
import type { ActionItem } from "@/lib/action-items";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Square, Zap } from "lucide-react";
import { toggleActionItem } from "@/app/actions";
import { cn } from "@/lib/utils";

type ActionItemsPanelProps = {
  weekStart: string;
  items: ActionItem[];
};

const priorityStyle = {
  P1: "border-primary/40 bg-primary/10 text-primary",
  P2: "border-foreground/10 bg-muted/50 text-foreground",
  P3: "border-foreground/5 bg-transparent text-muted-foreground",
};

export function ActionItemsPanel({ weekStart, items }: ActionItemsPanelProps) {
  const [pending, startTransition] = useTransition();

  const openCount = items.filter((i) => !i.done).length;

  function handleToggle(itemId: string, done: boolean) {
    startTransition(() => toggleActionItem(weekStart, itemId, done));
  }

  if (items.length === 0) {
    return (
      <Card className="border-dashed border-foreground/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="size-4 text-muted-foreground" />
            Actions
          </CardTitle>
          <CardDescription>Import a PDF to auto-generate actions for this period.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="size-4 text-primary" />
          Actions
        </CardTitle>
        <CardDescription>{openCount} open</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={pending}
            onClick={() => handleToggle(item.id, !item.done)}
            className={cn(
              "flex w-full items-start gap-3 border border-foreground/[0.06] p-4 text-left transition-all hover:border-primary/30 hover:bg-primary/[0.04]",
              item.done && "opacity-50",
            )}
          >
            {item.done ? (
              <CheckSquare className="mt-0.5 size-5 shrink-0 text-primary" />
            ) : (
              <Square className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={cn("border px-2 font-bold", priorityStyle[item.priority])}>
                  {item.priority}
                </Badge>
                <span className={cn("text-sm font-semibold", item.done && "line-through")}>
                  {item.title}
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
