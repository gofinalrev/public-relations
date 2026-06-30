import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  format,
  parseISO,
  isMonday,
  nextMonday,
} from "date-fns";

export function getWeekStart(date: Date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function getWeekEnd(weekStart: Date): Date {
  return endOfWeek(weekStart, { weekStartsOn: 1 });
}

export function toWeekKey(date: Date): string {
  return format(getWeekStart(date), "yyyy-MM-dd");
}

export function parseWeekKey(key: string): Date {
  return parseISO(key);
}

export function formatWeekLabel(weekStart: Date): string {
  const end = getWeekEnd(weekStart);
  return `${format(weekStart, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
}

export function getCurrentWeekKey(): string {
  return toWeekKey(new Date());
}

export function getPreviousWeekKey(weekKey: string): string {
  const weekStart = parseWeekKey(weekKey);
  return toWeekKey(subWeeks(weekStart, 1));
}

export function getNextWeekKey(weekKey: string): string {
  const weekStart = parseWeekKey(weekKey);
  return toWeekKey(addWeeks(weekStart, 1));
}

export function getRecentWeekKeys(count: number): string[] {
  const keys: string[] = [];
  let current = getWeekStart(new Date());
  for (let i = 0; i < count; i++) {
    keys.unshift(toWeekKey(current));
    current = subWeeks(current, 1);
  }
  return keys;
}

export function isMondayToday(): boolean {
  return isMonday(new Date());
}

export function daysUntilNextMonday(): number {
  const today = new Date();
  const monday = isMonday(today) ? today : nextMonday(today);
  const diff = monday.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
