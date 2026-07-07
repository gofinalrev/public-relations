import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function formatDelta(current: number, previous: number | null): { value: string; positive: boolean | null } {
  if (previous === null || previous === 0) return { value: "—", positive: null };
  if (current === 0) return { value: "—", positive: null };
  const pct = ((current - previous) / previous) * 100;
  const positive = pct >= 0;
  return { value: `${positive ? "+" : ""}${pct.toFixed(0)}%`, positive };
}
