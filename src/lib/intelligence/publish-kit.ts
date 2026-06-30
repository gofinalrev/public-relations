import { buildUtmUrl } from "@/lib/utm";
import type { PostHighlight } from "@/lib/post-highlights";
import { platformLabel } from "@/lib/post-highlights";
import type { PublishKit, PublishKitStep } from "./types";

const KIT_PLATFORMS: PublishKit["steps"][number]["platform"][] = [
  "youtube",
  "instagram",
  "x",
  "linkedin",
  "tiktok",
];

export function buildPublishKit(
  source: { title: string; product?: PostHighlight["product"]; notes?: string },
  weekStart: string,
): PublishKit {
  const brand = source.product === "tooltrace" ? "tooltrace" : "finalrev";
  const campaign = `publish-kit-${weekStart}`;

  const steps: PublishKitStep[] = KIT_PLATFORMS.map((platform, i) => {
    const utmUrl =
      brand === "tooltrace"
        ? buildUtmUrl("tooltrace", platform === "x" ? "x" : platform, "social", campaign, source.title.slice(0, 30))
        : buildUtmUrl("finalrev", platform, "social", campaign, source.title.slice(0, 30));

    let caption = "";
    let notes = "";

    switch (platform) {
      case "youtube":
        caption = `${source.title}. Shop floor to finished part. Link in description.`;
        notes = "Upload Short first. Pin comment with designer link.";
        break;
      case "instagram":
        caption = `Same clip, native cover: text hook in frame 1.\n\n${source.title}\n\n#cnc #manufacturing #machinist`;
        notes = "Post 4h after YouTube. Reel format only.";
        break;
      case "x":
        caption = `${source.title}\n\n${brand === "tooltrace" ? "tooltrace.ai/designer" : "finalrev.com"}`;
        notes = "Thread if >280 chars. Lead with payoff GIF.";
        break;
      case "linkedin":
        caption = `Engineering takeaway from the shop floor:\n\n${source.title}\n\nWhat would you quote this at?`;
        notes = "DFM / quote trust angle for finalREV.";
        break;
      case "tiktok":
        caption = `${source.title} 🔧 #cnc #machinist`;
        notes = "Vertical format, on-screen text.";
        break;
    }

    return { platform, order: i + 1, caption, utmUrl, notes };
  });

  return {
    title: source.title,
    steps,
    threadMode: source.title.length > 200,
    postOrderSummary: KIT_PLATFORMS.map((p, i) => `${i + 1}. ${platformLabel(p)}`).join(" → "),
  };
}
