import Image from "next/image";
import { cn } from "@/lib/utils";
import { getPlatformLogoAlt, getPlatformLogoPath } from "@/lib/platform-logos";
import { Globe } from "lucide-react";

type PlatformLogoProps = {
  platformOrSlug: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizePx = { sm: 28, md: 36, lg: 44 } as const;
const containerClass = {
  sm: "size-8",
  md: "size-10",
  lg: "size-12",
} as const;

export function PlatformLogo({ platformOrSlug, name, size = "md", className }: PlatformLogoProps) {
  const src = getPlatformLogoPath(platformOrSlug);
  const px = sizePx[size];
  const alt = getPlatformLogoAlt(platformOrSlug, name);

  if (!src) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center bg-muted text-muted-foreground",
          containerClass[size],
          className,
        )}
        aria-hidden
      >
        <Globe className={size === "sm" ? "size-4" : size === "lg" ? "size-6" : "size-5"} />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden bg-foreground/[0.06]",
        containerClass[size],
        className,
      )}
    >
      <Image src={src} alt={alt} width={px} height={px} className="object-contain p-0.5" />
    </span>
  );
}
