export const metadata = {
  title: "404 Not Found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fafafa] px-6 font-sans text-[#333]">
      <div className="text-center">
        <p className="text-6xl font-light text-[#999]">404</p>
        <p className="mt-2 text-sm text-[#666]">This page could not be found.</p>
      </div>
    </main>
  );
}
