import * as React from "react";
import { cn } from "@/lib/utils";

function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "secondary" | "success" | "warning" | "outline";
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        variant === "default" && "border-primary/40 bg-primary/15 text-primary",
        variant === "secondary" && "border-foreground/10 bg-muted/80 text-muted-foreground",
        variant === "success" && "border-primary/50 bg-primary/20 text-primary",
        variant === "warning" && "border-yellow-600/35 bg-yellow-500/10 text-yellow-900 dark:border-yellow-500/40 dark:bg-yellow-500/10 dark:text-yellow-400",
        variant === "outline" && "border-foreground/10 text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
