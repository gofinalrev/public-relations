/** Shared social platform metadata for channels, PDF parsing, and breakdown UI */
export const SOCIAL_PLATFORMS = {
  youtube: {
    slug: "youtube",
    name: "YouTube",
    handle: "@gofinalrev",
    url: "https://www.youtube.com/@gofinalrev",
    pdfLabels: ["Youtube", "YouTube"],
  },
  x: {
    slug: "x",
    name: "X",
    handle: "@gofinalrev",
    url: "https://x.com/gofinalrev",
    pdfLabels: ["Twitter", "X"],
  },
  instagram: {
    slug: "instagram",
    name: "Instagram",
    handle: "@gofinalrev",
    url: "https://instagram.com/gofinalrev",
    pdfLabels: ["Instagram"],
  },
  linkedin: {
    slug: "linkedin",
    name: "LinkedIn",
    handle: "finalREV",
    url: "https://www.linkedin.com/company/finalrev",
    pdfLabels: ["Linkedin", "LinkedIn"],
  },
  tiktok: {
    slug: "tiktok",
    name: "TikTok",
    handle: "@gofinalrev",
    url: "https://www.tiktok.com/@gofinalrev",
    pdfLabels: ["Tiktok", "TikTok"],
  },
  facebook: {
    slug: "facebook",
    name: "Facebook",
    handle: "@gofinalrev",
    url: "https://www.facebook.com/gofinalrev",
    pdfLabels: ["Facebook"],
  },
  reddit: {
    slug: "reddit",
    name: "Reddit",
    handle: "r/finalrev",
    url: "https://www.reddit.com/r/finalrev",
    pdfLabels: ["Reddit"],
  },
} as const;

export type SocialPlatformSlug = keyof typeof SOCIAL_PLATFORMS;

export const SOCIAL_PLATFORM_SLUGS = Object.keys(SOCIAL_PLATFORMS) as SocialPlatformSlug[];
