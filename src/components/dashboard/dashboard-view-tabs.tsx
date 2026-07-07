"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { getCurrentWeekKey } from "@/lib/weeks";
import { LayoutDashboard, CalendarDays, LineChart, Briefcase } from "lucide-react";

type DashboardView = "overview" | "period" | "trends" | "toolkit";

type DashboardViewTabsProps = {
  weekStart: string;
  activeView: DashboardView;
};

const TABS: { id: DashboardView; label: string; shortLabel: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Summary", shortLabel: "Summary", icon: LayoutDashboard },
  { id: "period", label: "This week", shortLabel: "Week", icon: CalendarDays },
  { id: "trends", label: "History", shortLabel: "History", icon: LineChart },
  { id: "toolkit", label: "Toolkit", shortLabel: "Tools", icon: Briefcase },
];

export function DashboardViewTabs({ weekStart, activeView }: DashboardViewTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setView(view: DashboardView) {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "overview") {
      params.delete("view");
    } else {
      params.set("view", view);
    }
    if (weekStart !== getCurrentWeekKey()) {
      params.set("week", weekStart);
    }
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  return (
    <nav
      className="-mx-4 overflow-x-auto overscroll-x-contain border-b border-foreground/[0.08] px-4 scrollbar-thin sm:mx-0 sm:overflow-visible sm:px-0"
      aria-label="Dashboard views"
    >
      <div className="flex min-w-max gap-0.5 sm:min-w-0 sm:gap-1">
        {TABS.map(({ id, label, shortLabel, icon: Icon }) => {
          const active = activeView === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={cn(
                "flex min-h-[44px] min-w-[5.25rem] items-center justify-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors sm:min-h-0 sm:min-w-0 sm:flex-1 sm:px-4 sm:text-sm lg:flex-none",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0 opacity-70" />
              <span className="sm:hidden">{shortLabel}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
