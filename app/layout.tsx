/* ============================================================================
   Root layout — ops-console shell.

   What lives here:
     1. Font wiring. DM Sans for body, JetBrains Mono for headers / labels /
        numbers. CSS-variable names match @theme tokens in globals.css.
     2. Top navigation: a single thin bar with a path-style brand mark
        ("helvi/dashboard") and five route links in mono.
   ========================================================================== */

import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

/* ── Fonts ──────────────────────────────────────────────────────────────── */
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "helvi/dashboard",
  description: "Internal funnel dashboard for the Helvi landing-page acquisition funnel.",
  robots: { index: false, follow: false },
};

/* ── Nav structure ─────────────────────────────────────────────────────── */
const NAV_ITEMS: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/",             label: "overview" },
  { href: "/funnel",       label: "funnel" },
  { href: "/demographics", label: "demographics" },
  { href: "/sources",      label: "sources" },
  { href: "/leads",        label: "leads" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* === Top bar ===
            Single line, mono throughout. Brand mark reads like a path:
            "helvi/dashboard" with the slash as a subtle separator. */}
        <header className="border-b border-border bg-background sticky top-0 z-10">
          <div className="mx-auto max-w-7xl px-6 h-11 flex items-center gap-6 text-sm">
            <Link href="/" className="font-mono text-foreground tracking-tight">
              <span>helvi</span>
              <span className="text-muted-foreground mx-0.5">/</span>
              <span>dashboard</span>
            </Link>
            <nav className="flex items-center gap-5 font-mono text-muted-foreground text-xs ml-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        {/* === Page content === */}
        <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-8">{children}</main>

        {/* === Footer === */}
        <footer className="border-t border-border font-mono text-[11px] text-muted-foreground">
          <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
            <span>helvi/dashboard · src=web-scribe-magic-34.lovable.app</span>
            <span>tz=UTC</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
