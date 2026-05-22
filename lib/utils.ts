/* ============================================================================
   utils.ts — tiny helpers shared across components.

   Currently just `cn()` — the canonical shadcn class-merge helper. clsx
   handles conditional/falsy joining; tailwind-merge resolves conflicting
   tailwind classes ("px-2 px-4" → "px-4") which clsx alone cannot do.
   ========================================================================== */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/* ── Number formatters ────────────────────────────────────────────────────
   Stakeholders read en-CH formatting (1'234 thousands separator, comma
   decimal). Intl handles that for free. */
const NF_INT = new Intl.NumberFormat("en-CH", { maximumFractionDigits: 0 });
const NF_PCT = new Intl.NumberFormat("en-CH", { maximumFractionDigits: 1 });
const NF_COMPACT = new Intl.NumberFormat("en-CH", {
  maximumFractionDigits: 1,
  notation: "compact",
});

export function formatInt(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return NF_INT.format(n);
}

export function formatPct(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `${NF_PCT.format(n)}%`;
}

export function formatCompact(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return NF_COMPACT.format(n);
}

export function deltaPct(current: number | null | undefined, previous: number | null | undefined): number | null {
  if (
    current === null ||
    current === undefined ||
    previous === null ||
    previous === undefined ||
    Number.isNaN(current) ||
    Number.isNaN(previous) ||
    previous === 0
  ) {
    return null;
  }
  return ((current - previous) / previous) * 100;
}
