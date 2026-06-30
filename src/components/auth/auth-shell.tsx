import { cn } from "@/lib/utils";

type AuthShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function AuthShell({ children, className }: AuthShellProps) {
  return (
    <div className="dark auth-canvas relative flex min-h-dvh flex-col items-center justify-center px-4 py-10 text-foreground">
      <main className={cn("relative z-10 flex w-full max-w-sm flex-col items-center", className)}>
        {children}
      </main>
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
        "auth-card relative w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-black/50 p-8 text-center shadow-[0_24px_80px_-24px_rgba(0,0,0,0.85)] backdrop-blur-xl sm:p-10",
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

function FinalrevMark() {
  return (
    <p className="text-2xl font-black tracking-tight text-white">
      final<span className="text-primary">REV</span>
    </p>
  );
}

export function AuthBrand() {
  return (
    <div className="mb-8 text-center">
      <FinalrevMark />
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/40">PR Dashboard</p>
    </div>
  );
}
