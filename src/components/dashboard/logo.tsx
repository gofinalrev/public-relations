"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type FinalrevLogoProps = {
  className?: string;
  size?: number;
};

export function FinalrevLogo({ className, size = 36 }: FinalrevLogoProps) {
  const iconSize = size;

  return (
    <div className={cn("flex min-w-0 items-center gap-2 sm:gap-3", className)}>
      <div className="relative shrink-0">
        <div
          className="pointer-events-none absolute inset-0 scale-110 rounded-full bg-primary/15 blur-lg dark:bg-primary/25"
          aria-hidden
        />
        <Image
          src="/brand/finalrev/logo-light.svg"
          alt=""
          width={iconSize}
          height={iconSize}
          priority
          className={cn(
            "relative size-8 sm:size-9 dark:hidden",
            "drop-shadow-[0_0_6px_hsl(var(--primary)/0.2)]",
          )}
          aria-hidden
        />
        <Image
          src="/brand/finalrev/logo-dark.svg"
          alt="finalREV"
          width={iconSize}
          height={iconSize}
          priority
          className={cn(
            "relative hidden size-8 sm:size-9 dark:block",
            "drop-shadow-[0_0_10px_hsl(var(--primary)/0.55)] drop-shadow-[0_0_22px_hsl(var(--primary)/0.35)]",
          )}
        />
      </div>
      <div className="min-w-0 leading-none">
        <span className="text-base font-bold tracking-tight sm:text-lg">
          final<span className="text-primary">REV</span>
        </span>
        <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:text-[10px] sm:tracking-[0.25em]">
          PR Hub
        </p>
      </div>
    </div>
  );
}
