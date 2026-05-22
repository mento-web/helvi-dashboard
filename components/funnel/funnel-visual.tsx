/* ============================================================================
   funnel/funnel-visual.tsx — Centered-bar funnel visualization.

   Each step is a horizontal bar whose width is proportional to its
   visitor count as a percentage of the first step (Visited = 100%).
   Bars are centered so the stack reads as a tapering funnel without
   distorting ratios the way a trapezoid would.

   Between each pair of consecutive steps we render a small drop-off
   marker (− pct points and absolute count lost) so the stage-to-stage
   attrition is visible inline with the bars.

   Pure presentational component — no recharts, no client APIs — so it
   stays a Server Component and renders inline with the page.
   ========================================================================== */

import * as React from "react";
import { cn, formatInt, formatPct } from "@/lib/utils";

export type FunnelVisualRow = {
  label: string;
  reached: number;
  // reached / visited * 100, where visited is the first step. First row = 100.
  pct_of_visited: number;
  // (prev.reached - this.reached) / prev.reached * 100. null on the first row.
  drop_from_prev_pct: number | null;
  // prev.reached - this.reached. null on the first row.
  drop_from_prev_count: number | null;
};

export function FunnelVisual({ rows }: { rows: FunnelVisualRow[] }) {
  if (rows.length === 0) return null;

  // Visited (top) and Booked (bottom) anchor the overall-conversion callout.
  const visited = rows[0].reached;
  const final = rows[rows.length - 1];
  const overallPct = final.pct_of_visited;

  return (
    <div className="flex flex-col">
      {rows.map((row, idx) => (
        <React.Fragment key={row.label}>
          {/* ── Drop-off marker between stages ────────────────────────── */}
          {idx > 0 && row.drop_from_prev_pct !== null && (
            <div className="flex items-stretch gap-4 px-4">
              <div className="w-48 shrink-0" />
              <div className="flex-1 flex items-center justify-center py-1">
                <span
                  className={cn(
                    "font-mono text-[11px] tabular-nums",
                    row.drop_from_prev_pct > 0 ? "text-muted-foreground" : "text-muted-foreground/50",
                  )}
                >
                  <span className="text-foreground/60">↓</span>
                  <span className="ml-1">
                    −{row.drop_from_prev_pct.toFixed(1)}%
                  </span>
                  <span className="ml-2 opacity-70">
                    ({formatInt(row.drop_from_prev_count ?? 0)} lost)
                  </span>
                </span>
              </div>
              <div className="w-36 shrink-0" />
            </div>
          )}

          {/* ── Funnel row: label · centered bar · reached + pct ──────── */}
          <div className="flex items-center gap-4 px-4 py-1.5">
            {/* Left: step number + label */}
            <div className="w-48 shrink-0 flex items-center gap-2">
              <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <span className="text-sm">{row.label}</span>
            </div>

            {/* Middle: centered bar — width is pct_of_visited */}
            <div className="flex-1 h-9 flex items-center justify-center">
              <div
                className={cn(
                  "h-full rounded-sm bg-accent transition-all",
                  idx === 0 ? "opacity-100" : "opacity-90",
                )}
                style={{
                  // floor at a tiny sliver so a zero-conversion stage is still visible
                  width: `${Math.max(row.pct_of_visited, 0.4)}%`,
                }}
                aria-label={`${row.label}: ${formatInt(row.reached)} visitors, ${formatPct(row.pct_of_visited)} of visited`}
              />
            </div>

            {/* Right: visitor count + pct of visited */}
            <div className="w-36 shrink-0 text-right font-mono text-xs tabular-nums">
              <span className="text-foreground">{formatInt(row.reached)}</span>
              <span className="text-muted-foreground ml-2">{formatPct(row.pct_of_visited)}</span>
            </div>
          </div>
        </React.Fragment>
      ))}

      {/* ── Overall conversion callout ────────────────────────────────── */}
      <div className="mt-3 mx-4 pt-3 border-t border-border flex items-center justify-between font-mono">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
          overall conversion · visited → booked
        </span>
        <span className="tabular-nums">
          <span className="text-foreground text-sm font-medium">{formatPct(overallPct)}</span>
          <span className="text-muted-foreground text-xs ml-2">
            ({formatInt(final.reached)} / {formatInt(visited)})
          </span>
        </span>
      </div>
    </div>
  );
}
