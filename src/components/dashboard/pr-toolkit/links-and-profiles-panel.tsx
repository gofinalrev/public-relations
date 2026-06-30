"use client";

import { UtmLinkGenerator } from "@/components/dashboard/utm-link-generator";
import { SocialProfilesPanel } from "./social-profiles-panel";

type LinksAndProfilesPanelProps = {
  weekStart: string;
};

export function LinksAndProfilesPanel({ weekStart }: LinksAndProfilesPanelProps) {
  return (
    <div className="space-y-4">
      <UtmLinkGenerator weekStart={weekStart} />
      <SocialProfilesPanel variant="full" />
      <SocialProfilesPanel variant="urls-only" />
    </div>
  );
}
