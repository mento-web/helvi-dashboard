/* ============================================================================
   ui/kpi-tile.tsx — single big-number tile used across the Overview KPI
   strip and inline on the detail pages.

   Always renders three rows: label, value, and (optional) delta/footnote.
   Number formatting is the caller's job — pass a pre-formatted string.
   ========================================================================== */

import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  hint?: string;
  /** Optional accent tint var name — e.g. "tint-powder-blue" — for the
   *  small left-edge color bar. Maps to the @theme tokens in globals.css. */
  tint?: "lavender" | "powder-blue" | "dusty-pink" | "taupe" | "moss" | "peach";
  className?: string;
};

const TINT_BG: Record<NonNullable<Props["tint"]>, string> = {
  "lavender":     "bg-tint-lavender",
  "powder-blue":  "bg-tint-powder-blue",
  "dusty-pink":   "bg-tint-dusty-pink",
  "taupe":        "bg-tint-taupe",
  "moss":         "bg-tint-moss",
  "peach":        "bg-tint-peach",
};

export function KpiTile({ label, value, hint, tint, className }: Props) {
  return (
    <div
      className={cn(
        "relative rounded-lg border border-border bg-card p-6 overflow-hidden",
        className,
      )}
    >
      {tint && (
        <span
          aria-hidden
          className={cn("absolute inset-y-0 left-0 w-1.5", TINT_BG[tint])}
        />
      )}
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 font-editorial text-4xl leading-none tracking-tight">{value}</div>
      {hint && <div className="mt-2 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
