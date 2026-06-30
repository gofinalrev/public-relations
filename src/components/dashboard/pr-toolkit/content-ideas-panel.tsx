import type { Channel, WeeklyReport } from "@/lib/db";
import type { DashboardPeriodContext } from "@/lib/period-context";
import { buildPrContentIdeas } from "@/lib/pr-toolkit/content-ideas";
import { CONTENT_PILLARS } from "@/lib/pr-toolkit/copy-blocks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlatformLogo } from "@/components/dashboard/platform-logo";
import { Lightbulb } from "lucide-react";

type ContentIdeasPanelProps = {
  report: WeeklyReport | null;
  channels: Channel[];
  context: DashboardPeriodContext;
};

const priorityVariant = {
  high: "warning" as const,
  medium: "default" as const,
  low: "secondary" as const,
};

export function ContentIdeasPanel({ report, channels, context }: ContentIdeasPanelProps) {
  const ideas = buildPrContentIdeas(report, channels, context);
  const hasData = Boolean(report?.metricool_synced_at || report?.posthog_synced_at);

  return (
    <div className="space-y-4">
      {!hasData && (
        <Card className="border-dashed border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-4 text-sm text-muted-foreground">
            Import a Metricool PDF on the <strong>This period</strong> tab first — ideas below use generic pillars until
            we have this week&apos;s data.
          </CardContent>
        </Card>
      )}

      <Card className="border-primary/15">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="size-5 text-primary" />
            Suggested for {context.activityLabel}
          </CardTitle>
          <CardDescription>
            Generated from this period&apos;s metrics, channel goals, and growth insights — not generic social advice
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {ideas.map((idea) => (
            <div key={idea.id} className="border border-foreground/[0.08] p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant={priorityVariant[idea.priority]}>{idea.priority}</Badge>
                <span className="text-sm font-semibold">{idea.title}</span>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{idea.body}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {idea.platforms.map((p) =>
                  p === "all" ? (
                    <Badge key={p} variant="outline" className="text-[10px]">
                      all platforms
                    </Badge>
                  ) : (
                    <Badge key={p} variant="outline" className="gap-1 text-[10px] font-normal">
                      <PlatformLogo platformOrSlug={p} size="sm" />
                      {p}
                    </Badge>
                  ),
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Always-on pillars</CardTitle>
          <CardDescription>When metrics are flat, rotate these formats</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {CONTENT_PILLARS.map((p) => (
            <div key={p.id} className="border border-foreground/[0.06] bg-muted/20 p-3 text-sm">
              <p className="font-medium">{p.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{p.formats.join(" · ")}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
