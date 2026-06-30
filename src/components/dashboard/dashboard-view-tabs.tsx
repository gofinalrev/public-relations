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

const TABS: { id: DashboardView; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "period", label: "Details", icon: CalendarDays },
  { id: "trends", label: "Trends", icon: LineChart },
  { id: "toolkit", label: "Toolkit", icon: Briefcase },
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
    <nav className="flex gap-1 border-b border-foreground/[0.08]" aria-label="Dashboard views">
      {TABS.map(({ id, label, icon: Icon }) => {
        const active = activeView === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            className={cn(
              "flex min-h-[44px] flex-1 items-center justify-center gap-1.5 border-b-2 px-2 py-2.5 text-sm font-medium transition-colors sm:min-h-0 sm:flex-none sm:px-4",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
