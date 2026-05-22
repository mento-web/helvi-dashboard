/* ============================================================================
   ui/kpi-tile.tsx — Shopify-style metric card.

   Vertical hierarchy:
     1. Label at top (small, dotted underline = tooltip affordance)
     2. Hero metric (large, semibold, tabular numerals)
     3. Delta — small chip to the right of the metric, colored by sign
     4. Optional inline sparkline filling the remaining vertical space

   Renders inside the standard <Card> shell — this component IS the card
   for KPI tiles, so it owns its own surface + padding rather than being
   composed from <Card>/<CardHeader>/etc. That keeps the visual hierarchy
   tight (no extra header padding before the hero number).
   ========================================================================== */

import * as React from "react";
import { DashboardExploreButton } from "@/components/ui/dashboard-actions";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  /** Numeric delta vs. comparison period. Sign drives the color + arrow. */
  delta?: number | null;
  /** Optional descriptor for the period footer at the bottom of the tile. */
  hint?: string;
  comparisonHint?: string;
  /** Optional sparkline data — recharts wrappers in components/charts. */
  sparkline?: React.ReactNode;
  className?: string;
};

function formatDelta(delta: number): string {
  const abs = Math.abs(delta);
  // Show one decimal for small movement, integer for larger.
  const formatted = abs >= 10 ? abs.toFixed(0) : abs.toFixed(1);
  if (delta === 0) return "0.0%";
  return `${delta > 0 ? "↗" : "↘"} ${formatted}%`;
}

export function KpiTile({ label, value, delta, hint, comparisonHint, sparkline, className }: Props) {
  const hasDelta = typeof delta === "number" && !Number.isNaN(delta);
  const positive = hasDelta && delta! > 0;
  const negative = hasDelta && delta! < 0;

  return (
    <div data-dashboard-card className={cn("rounded-[10px] bg-card shadow-card p-5 flex flex-col", className)}>
      {/* === Label === */}
      <div className="flex items-start justify-between gap-3">
        <div className="text-[13px] font-medium text-muted-foreground tooltip-label">
          {label}
        </div>
        <DashboardExploreButton label={label} />
      </div>

      {/* === Metric + delta === */}
      <div className="mt-2 flex items-baseline gap-2 flex-wrap">
        <span className="num text-[30px] leading-none font-semibold text-foreground">
          {value}
        </span>
        {hasDelta && (
          <span
            className={cn(
              "text-[12px] font-medium num",
              positive && "text-success",
              negative && "text-destructive",
              !positive && !negative && "text-muted-foreground",
            )}
          >
            {formatDelta(delta!)}
          </span>
        )}
      </div>

      {/* === Sparkline (optional) === */}
      {sparkline && <div className="mt-3 -mx-1">{sparkline}</div>}

      {/* === Footer hint === */}
      {(hint || comparisonHint) && (
        <div className="mt-auto pt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {hint && (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-px w-5 bg-accent" aria-hidden />
              <span>{hint}</span>
            </span>
          )}
          {comparisonHint && (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-px w-5 border-t border-dotted border-accent-muted" aria-hidden />
              <span>{comparisonHint}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
