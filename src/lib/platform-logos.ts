import type { SocialPlatformSlug } from "@/lib/platforms";

/** PNG paths under /public/logos — brand icons for at-a-glance scanning */
export const PLATFORM_LOGO_PATHS: Record<SocialPlatformSlug | "finalrev" | "tooltrace", string> = {
  youtube: "/logos/youtube.png",
  x: "/logos/x.png",
  instagram: "/logos/instagram.png",
  linkedin: "/logos/linkedin.png",
  tiktok: "/logos/tiktok.png",
  facebook: "/logos/facebook.png",
  reddit: "/logos/reddit.png",
  finalrev: "/brand/finalrev/logo-light.svg",
  tooltrace: "/brand/tooltrace/logo-light.svg",
};

export function getPlatformLogoPath(platformOrSlug: string): string | null {
  if (platformOrSlug in PLATFORM_LOGO_PATHS) {
    return PLATFORM_LOGO_PATHS[platformOrSlug as keyof typeof PLATFORM_LOGO_PATHS];
  }

  if (platformOrSlug === "finalrev-web") return PLATFORM_LOGO_PATHS.finalrev;
  if (platformOrSlug === "tooltrace-web") return PLATFORM_LOGO_PATHS.tooltrace;

  return null;
}

export function getPlatformLogoAlt(platformOrSlug: string, fallbackName?: string): string {
  const labels: Record<string, string> = {
    youtube: "YouTube",
    x: "X",
    instagram: "Instagram",
    linkedin: "LinkedIn",
    tiktok: "TikTok",
    facebook: "Facebook",
    reddit: "Reddit",
    finalrev: "finalREV",
    tooltrace: "Tooltrace",
    "finalrev-web": "finalREV",
    "tooltrace-web": "Tooltrace",
  };
  return labels[platformOrSlug] ?? fallbackName ?? platformOrSlug;
}
