import type { SummaryLine } from "@/lib/overview-summary";
import { summaryProductLabel } from "@/lib/overview-summary";

type OverviewSummaryCardProps = {
  lines: SummaryLine[];
  teamNote?: string | null;
};

export function OverviewSummaryCard({ lines, teamNote }: OverviewSummaryCardProps) {
  if (lines.length === 0 && !teamNote) return null;

  return (
    <div className="space-y-3 border-l-2 border-foreground/10 pl-4">
      {lines.map((line, i) => (
        <p key={`${line.product}-${i}`} className="text-sm leading-relaxed text-foreground/90">
          <span className="font-medium text-foreground">{summaryProductLabel(line.product)}.</span>{" "}
          {line.text}
        </p>
      ))}
      {teamNote && (
        <p className="border-t border-foreground/[0.06] pt-3 text-sm leading-relaxed text-muted-foreground">
          {teamNote}
        </p>
      )}
    </div>
  );
}
