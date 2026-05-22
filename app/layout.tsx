/* ============================================================================
   Root layout — Shopify-inspired two-zone shell.

   Left: 240px sidebar with all navigation (see components/shell/sidebar).
   Right: white 56px top bar with only the Helvi wordmark, then a warm-gray
   content canvas where white floating cards live.

   The top bar is intentionally sparse — no breadcrumbs, no search, no
   avatar. The logo doubles as a persistent "home" link. The dashboard's
   own H1 lives inside the content area below.
   ========================================================================== */

import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Sidebar } from "@/components/shell/sidebar";

/* ── Fonts — Inter for everything; mono kept on hand for the rare ID /
   timestamp the leads table still surfaces. */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Helvi · Dashboard",
  description: "Internal funnel dashboard for the Helvi landing-page acquisition funnel.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <div className="flex min-h-screen">
          {/* === Left sidebar (240px, fixed) === */}
          <Sidebar />

          {/* === Right column: top bar + content === */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top bar — white, single horizontal line beneath, just the wordmark. */}
            <header className="h-14 bg-card border-b border-border flex items-center px-6">
              <Link
                href="/"
                aria-label="helvi · home"
                className="text-[22px] leading-none font-semibold tracking-normal"
              >
                helvi
              </Link>
            </header>

            {/* Content canvas */}
            <main className="flex-1 px-6 lg:px-8 py-8">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
