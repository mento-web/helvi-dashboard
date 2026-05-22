/* ============================================================================
   ui/kpi-tile.tsx — dense data tile.

   Layout:
     [label in mono caps, xs, muted]
     [big mono number, tabular-nums]
     [optional hint, xs muted]

   The optional `tint` adds a thin top accent stripe in the Helvi palette —
   used to differentiate KPI categories at a glance without flooding the
   tile background.
   ========================================================================== */

import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  hint?: string;
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
        "relative rounded-md border border-border bg-card px-4 py-3 overflow-hidden",
        className,
      )}
    >
      {tint && (
        <span
          aria-hidden
          className={cn("absolute top-0 left-0 right-0 h-0.5", TINT_BG[tint])}
        />
      )}
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 metric text-2xl font-medium text-foreground">{value}</div>
      {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}
