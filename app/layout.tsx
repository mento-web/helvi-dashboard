/* ============================================================================
   Root layout — the only place the dashboard's chrome is defined.

   What lives here:
     1. Font wiring. DM Sans (body) and Instrument Serif (editorial
        headlines) are loaded via next/font/google. The CSS-variable names
        (--font-dm-sans, --font-instrument-serif) are referenced by
        @theme in app/globals.css under --font-sans / --font-serif.
     2. The top navigation bar — five links to the five dashboard pages.
        Defined inline in a server component below; no client interactivity
        beyond a hover state, so no "use client" needed.

   What does NOT live here:
     - No auth gate. v1 access control is Vercel Password Protection,
       configured in the Vercel project settings, applied at the edge
       before requests reach this layout.
     - No data fetching. Pages fetch their own data via lib/queries/*.
   ========================================================================== */

import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif } from "next/font/google";
import Link from "next/link";
import "./globals.css";

/* ── Fonts ────────────────────────────────────────────────────────────────
   Loaded via next/font so they ship as part of the build and don't add
   a render-blocking <link> to Google Fonts. The CSS variable names match
   the ones referenced inside @theme in app/globals.css. */
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Helvi · Funnel Dashboard",
  description: "Internal dashboard for the Helvi landing-page acquisition funnel.",
  // Stakeholders share a URL; we don't want search engines indexing it.
  robots: { index: false, follow: false },
};

/* ── Nav structure ───────────────────────────────────────────────────────
   Kept as a const array so the TopNav below stays declarative. Adding a
   new page = appending one row here + creating app/<slug>/page.tsx. */
const NAV_ITEMS: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/",             label: "Overview" },
  { href: "/funnel",       label: "Funnel" },
  { href: "/demographics", label: "Demographics" },
  { href: "/sources",      label: "Sources" },
  { href: "/leads",        label: "Leads" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${instrumentSerif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* === Top navigation bar === */}
        <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-10">
          <div className="mx-auto max-w-7xl px-6 h-14 flex items-center gap-8">
            {/* Lowercase helvi wordmark — same brand rule as the landing page. */}
            <Link href="/" className="font-editorial text-2xl leading-none tracking-tight">
              helvi <span className="text-muted-foreground text-base">· dashboard</span>
            </Link>
            <nav className="flex items-center gap-6 text-sm text-muted-foreground">
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
        <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-10">{children}</main>

        {/* === Footer ===
            Single-line attribution. Stakeholders read the timezone so they
            don't misread a chart that's aggregated in UTC. */}
        <footer className="border-t border-border text-xs text-muted-foreground">
          <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
            <span>helvi-dashboard · data from web-scribe-magic-34.lovable.app</span>
            <span>All times in UTC</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
