"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import {
  formatWeekLabel,
  parseWeekKey,
  getCurrentWeekKey,
  getPreviousWeekKey,
  getNextWeekKey,
} from "@/lib/weeks";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type WeekSelectorProps = {
  weekStart: string;
};

export function WeekSelector({ weekStart }: WeekSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCurrentWeek = weekStart === getCurrentWeekKey();
  const weekLabel = formatWeekLabel(parseWeekKey(weekStart));

  function navigate(direction: "prev" | "next") {
    const key = direction === "prev" ? getPreviousWeekKey(weekStart) : getNextWeekKey(weekStart);
    const params = new URLSearchParams(searchParams.toString());
    params.set("week", key);
    router.push(`/?${params.toString()}`);
  }

  function goToCurrentWeek() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("week");
    router.push(params.toString() ? `/?${params.toString()}` : "/");
  }

  return (
    <div
      className={cn(
        "flex w-full min-w-0 items-center gap-0.5 border border-foreground/[0.08] bg-card/80 p-0.5 backdrop-blur-sm",
        "sm:w-auto sm:gap-1 sm:p-1",
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("prev")}
        aria-label="Previous week"
        className="size-10 shrink-0 sm:size-9"
      >
        <ChevronLeft />
      </Button>
      <div className="flex min-w-0 flex-1 flex-col items-center px-1 py-0.5 sm:min-w-[9.5rem] sm:px-3 sm:py-1">
        <div className="flex max-w-full items-center justify-center gap-1 text-xs font-semibold sm:gap-1.5 sm:text-sm">
          <CalendarDays className="size-3.5 shrink-0 text-primary" />
          <span className="truncate">{weekLabel}</span>
        </div>
        {isCurrentWeek && (
          <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-primary sm:text-[10px]">
            Current
          </span>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("next")}
        disabled={isCurrentWeek}
        aria-label="Next week"
        className="size-10 shrink-0 sm:size-9"
      >
        <ChevronRight />
      </Button>
      {!isCurrentWeek && (
        <Button
          variant="default"
          size="sm"
          onClick={goToCurrentWeek}
          className="ml-0.5 shrink-0 px-2 text-xs sm:ml-1 sm:px-3 sm:text-sm"
        >
          Today
        </Button>
      )}
    </div>
  );
}
