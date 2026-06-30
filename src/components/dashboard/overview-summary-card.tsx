import type { SummaryLine, SummaryProduct } from "@/lib/overview-summary";
import { summaryProductLabel } from "@/lib/overview-summary";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const productTone: Record<SummaryProduct, string> = {
  social: "border-foreground/15 bg-muted/40 text-foreground",
  tooltrace: "border-primary/30 bg-primary/10 text-primary",
  finalrev: "border-foreground/15 bg-muted/30 text-foreground",
};

type OverviewSummaryCardProps = {
  lines: SummaryLine[];
  teamNote?: string | null;
  tone?: string;
};

export function OverviewSummaryCard({ lines, teamNote, tone }: OverviewSummaryCardProps) {
  if (lines.length === 0 && !teamNote) return null;

  return (
    <Card className={cn("border", tone)}>
      <CardContent className="space-y-4 p-5 sm:p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Summary</p>

        {lines.length > 0 && (
          <ul className="space-y-3">
            {lines.map((line, i) => (
              <li key={`${line.product}-${i}`} className="flex gap-3 text-sm leading-relaxed">
                <span
                  className={cn(
                    "mt-0.5 shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    productTone[line.product],
                  )}
                >
                  {summaryProductLabel(line.product)}
                </span>
                <span className="min-w-0 flex-1 text-foreground/90">{line.text}</span>
              </li>
            ))}
          </ul>
        )}

        {teamNote && (
          <div className="border-t border-foreground/[0.06] pt-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Team note</p>
            <p className="mt-1 text-sm leading-relaxed text-foreground/90">{teamNote}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
