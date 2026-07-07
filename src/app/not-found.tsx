export const metadata = {
  title: "404 Not Found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="safe-top safe-bottom flex min-h-dvh items-center justify-center bg-background px-4 sm:px-6">
      <div className="text-center">
        <p className="text-5xl font-light text-muted-foreground sm:text-6xl">404</p>
        <p className="mt-2 text-sm text-muted-foreground">This page could not be found.</p>
      </div>
    </main>
  );
}
