"use client";

import { useTransition } from "react";
import type { ActionItem } from "@/lib/action-items";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Square } from "lucide-react";
import { toggleActionItem } from "@/app/actions";
import { cn } from "@/lib/utils";

type ActionItemsPanelProps = {
  weekStart: string;
  items: ActionItem[];
};

const priorityLabel = { P1: "1", P2: "2", P3: "3" } as const;

export function ActionItemsPanel({ weekStart, items }: ActionItemsPanelProps) {
  const [pending, startTransition] = useTransition();
  const openCount = items.filter((i) => !i.done).length;

  function handleToggle(itemId: string, done: boolean) {
    startTransition(() => toggleActionItem(weekStart, itemId, done));
  }

  if (items.length === 0) return null;

  return (
    <Card className="border-foreground/[0.08]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Tasks</CardTitle>
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
              "flex w-full items-start gap-3 border border-foreground/[0.06] p-3 text-left transition-colors hover:bg-muted/30",
              item.done && "opacity-50",
            )}
          >
            {item.done ? (
              <CheckSquare className="mt-0.5 size-4 shrink-0 text-primary" />
            ) : (
              <Square className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm font-medium", item.done && "line-through")}>
                <span className="mr-2 tabular-nums text-muted-foreground">
                  {priorityLabel[item.priority]}.
                </span>
                {item.title}
              </p>
              {item.body && (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
              )}
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
