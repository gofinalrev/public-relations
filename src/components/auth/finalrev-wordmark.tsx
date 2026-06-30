import Image from "next/image";
import { cn } from "@/lib/utils";

type FinalrevWordmarkProps = {
  className?: string;
  priority?: boolean;
};

export function FinalrevWordmark({ className, priority = true }: FinalrevWordmarkProps) {
  return (
    <div className={cn("relative w-[10.5rem] sm:w-[12rem]", className)}>
      <Image
        src="/brand/finalrev/wordmark-with-logo-light.svg"
        alt="finalREV"
        width={192}
        height={37}
        priority={priority}
        className="h-auto w-full dark:hidden"
      />
      <Image
        src="/brand/finalrev/wordmark-with-logo-dark.svg"
        alt="finalREV"
        width={192}
        height={37}
        priority={priority}
        className="hidden h-auto w-full dark:block"
      />
    </div>
  );
}
