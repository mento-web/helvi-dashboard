/* ============================================================================
   funnel/funnel-horizontal.tsx — Left-to-right tapering funnel.

   Each stage is a column. The funnel itself is a single SVG polygon
   whose top edge passes through the centre of each column at a y
   proportional to that step's % of Visited; the bottom edge sits on
   the baseline. The slope between two consecutive column centres IS
   the stage drop-off, visualised as the rate at which the polygon
   thins out.

   Around the SVG we render three HTML rows:
     · titles row    — step number + label per column
     · drop-off row  — "↓ −X.X%" markers centred on each column boundary
                       (one per inter-stage gap, none on the first column)
     · values row    — visitor count + % of Visited per column

   Pure presentational, no client APIs — stays a Server Component.
   ========================================================================== */

import * as React from "react";
import { cn, formatInt, formatPct } from "@/lib/utils";

export type FunnelHorizontalRow = {
  label: string;
  reached: number;
  // reached / visited * 100. First row = 100.
  pct_of_visited: number;
  // (prev.reached - this.reached) / prev.reached * 100. null on the first row.
  drop_from_prev_pct: number | null;
  // prev.reached - this.reached. null on the first row.
  drop_from_prev_count: number | null;
};

// SVG units. preserveAspectRatio="none" stretches us to whatever pixel
// dimensions the parent gives. Keeping it integer keeps the path strings clean.
const VBOX_W = 1000;
const VBOX_H = 240;

export function FunnelHorizontal({ rows }: { rows: FunnelHorizontalRow[] }) {
  const N = rows.length;
  if (N === 0) return null;

  const colWidth = VBOX_W / N;

  // y for a given pct-of-visited. Floored at a thin sliver so a 0% stage
  // still draws *something* on the right of the funnel.
  const yFor = (pct: number) => {
    const clamped = Math.max(pct, 0.6);
    return VBOX_H * (1 - clamped / 100);
  };

  // Anchor points: centre of each column at the height for that step.
  const anchors = rows.map((r, i) => ({
    cx: (i + 0.5) * colWidth,
    cy: yFor(r.pct_of_visited),
  }));

  // Path: start at the left edge at h_0 height (flat half-column), draw
  // through each centre, finish flat to the right edge at h_{N-1}, then
  // down to the baseline and close.
  const pathParts: string[] = [];
  pathParts.push(`M 0 ${anchors[0].cy.toFixed(2)}`);
  for (const a of anchors) {
    pathParts.push(`L ${a.cx.toFixed(2)} ${a.cy.toFixed(2)}`);
  }
  pathParts.push(`L ${VBOX_W} ${anchors[N - 1].cy.toFixed(2)}`);
  pathParts.push(`L ${VBOX_W} ${VBOX_H}`);
  pathParts.push(`L 0 ${VBOX_H}`);
  pathParts.push("Z");
  const path = pathParts.join(" ");

  const visited = rows[0].reached;
  const final = rows[N - 1];

  return (
    <div className="w-full">
      {/* ── Titles row ─────────────────────────────────────────────── */}
      <div className="grid grid-flow-col auto-cols-fr border-b border-border">
        {rows.map((r, i) => (
          <div
            key={r.label}
            className={cn(
              "px-2 py-2 text-center",
              i > 0 && "border-l border-border",
            )}
          >
            <div className="font-mono text-[10px] text-muted-foreground tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </div>
            <div className="text-xs font-medium leading-tight mt-0.5">
              {r.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Drop-off markers row ────────────────────────────────────
            Each non-first column carries the drop-off it inherited from
            the previous column. Marker is absolutely positioned at the
            LEFT edge of its column (= boundary with the previous one)
            and translated -50% to centre on that boundary. ─────────── */}
      <div className="grid grid-flow-col auto-cols-fr h-7">
        {rows.map((r, i) => (
          <div key={i} className="relative">
            {r.drop_from_prev_pct !== null && (
              <span
                className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 font-mono text-[10px] text-muted-foreground bg-card border border-border rounded px-1.5 py-0.5 tabular-nums whitespace-nowrap"
                title={`${formatInt(r.drop_from_prev_count ?? 0)} visitors lost between ${rows[i - 1].label} and ${r.label}`}
              >
                <span className="text-foreground/60">↓</span>
                <span className="ml-0.5">−{r.drop_from_prev_pct.toFixed(1)}%</span>
              </span>
            )}
          </div>
        ))}
      </div>

      {/* ── Funnel polygon ──────────────────────────────────────────
            preserveAspectRatio="none" lets the SVG stretch to the
            container width; non-scaling-stroke keeps the dividers 1px
            regardless of horizontal scale. ────────────────────────── */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${VBOX_W} ${VBOX_H}`}
          preserveAspectRatio="none"
          className="w-full h-[240px] block text-accent"
          aria-label="Acquisition funnel — visitors reaching each step as a share of Visited"
        >
          {/* Column dividers — dotted, behind the polygon */}
          {Array.from({ length: N - 1 }, (_, i) => {
            const x = (i + 1) * colWidth;
            return (
              <line
                key={i}
                x1={x}
                y1={0}
                x2={x}
                y2={VBOX_H}
                stroke="currentColor"
                strokeOpacity={0.12}
                strokeWidth={1}
                strokeDasharray="3 3"
                vectorEffect="non-scaling-stroke"
                style={{ color: "hsl(var(--foreground-raw))" }}
              />
            );
          })}
          {/* The tapering funnel itself */}
          <path d={path} fill="currentColor" fillOpacity={0.9} />
        </svg>
      </div>

      {/* ── Values row ─────────────────────────────────────────────── */}
      <div className="grid grid-flow-col auto-cols-fr border-t border-border">
        {rows.map((r, i) => (
          <div
            key={r.label}
            className={cn(
              "px-2 py-2 text-center",
              i > 0 && "border-l border-border",
            )}
          >
            <div className="font-mono text-sm tabular-nums">
              {formatInt(r.reached)}
            </div>
            <div className="font-mono text-[10px] text-muted-foreground tabular-nums mt-0.5">
              {formatPct(r.pct_of_visited)}
            </div>
          </div>
        ))}
      </div>

      {/* ── Overall conversion callout ─────────────────────────────── */}
      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between font-mono">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
          overall conversion · visited → booked
        </span>
        <span className="tabular-nums">
          <span className="text-foreground text-sm font-medium">
            {formatPct(final.pct_of_visited)}
          </span>
          <span className="text-muted-foreground text-xs ml-2">
            ({formatInt(final.reached)} / {formatInt(visited)})
          </span>
        </span>
      </div>
    </div>
  );
}
