import Link from "next/link";
import { FinalrevWordmark } from "@/components/auth/finalrev-wordmark";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function AuthShell({ children, className }: AuthShellProps) {
  return (
    <div className="dark auth-canvas relative flex min-h-dvh flex-col text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(204,255,0,0.14),transparent_42%)]"
        aria-hidden
      />

      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8">
        <Link href="https://www.finalrev.com" className="transition-opacity hover:opacity-80">
          <FinalrevWordmark />
        </Link>
        <span className="hidden rounded-full border border-white/10 bg-black/40 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50 sm:inline">
          Internal
        </span>
      </header>

      <main className={cn("relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-10 pt-4 sm:px-6", className)}>
        {children}
      </main>

      <footer className="relative z-10 flex flex-col items-center gap-2 px-4 pb-6 text-center sm:pb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">pr.finalrev.com</p>
        <Link
          href="https://www.finalrev.com"
          className="text-xs text-white/40 transition-colors hover:text-primary"
        >
          finalrev.com
        </Link>
      </footer>
    </div>
  );
}

type AuthCardProps = {
  children: React.ReactNode;
  className?: string;
};

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        "auth-card relative w-full max-w-[26rem] overflow-hidden rounded-2xl border border-white/[0.08] bg-black/50 p-8 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.85)] backdrop-blur-xl sm:p-10",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
        aria-hidden
      />
      {children}
    </div>
  );
}
