import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeScript } from "@/components/theme/theme-script";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-figtree",
});

const siteUrl = process.env.APP_PUBLIC_URL?.trim() || "https://pr.finalrev.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "finalREV · PR Dashboard",
    template: "%s · finalREV PR",
  },
  description:
    "Weekly social, Tooltrace, and finalREV metrics for the PR team.",
  applicationName: "finalREV PR Dashboard",
  robots: { index: false, follow: false },
  openGraph: {
    title: "finalREV · PR Dashboard",
    description: "Weekly social, Tooltrace, and finalREV metrics.",
    siteName: "finalREV",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "finalREV · PR Dashboard",
    description: "Weekly social, Tooltrace, and finalREV metrics.",
  },
};

export const viewport: Viewport = {
  themeColor: "#CCFF00",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${figtree.variable} font-sans hub-canvas min-h-dvh overflow-x-hidden antialiased`}>
        <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>
      </body>
    </html>
  );
}
