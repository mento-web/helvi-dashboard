/* ============================================================================
   funnel/funnel-horizontal.tsx — Granular stage-bar funnel.

   Same data semantics as before: one column per canonical funnel step.
   Visually this mirrors a Shopify-style conversion-rate card: headline
   conversion, stage labels/counts, vertical separators, solid blue bars, and
   pale sloped connectors showing the drop from one step to the next.

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

// SVG units. preserveAspectRatio="none" stretches the chart to the scroll
// surface width; non-scaling strokes keep separators crisp.
const VBOX_W = 1000;
const VBOX_H = 300;
const BASELINE_Y = 280;
const TOP_PAD = 18;

export function FunnelHorizontal({ rows }: { rows: FunnelHorizontalRow[] }) {
  const N = rows.length;
  if (N === 0) return null;

  const colWidth = VBOX_W / N;
  const barWidth = Math.min(colWidth * 0.68, 92);
  const barInset = (colWidth - barWidth) / 2;

  // Height for a given pct-of-visited. Floored so a 0% stage still has a
  // visible baseline bar instead of disappearing.
  const heightFor = (pct: number) => {
    const maxHeight = BASELINE_Y - TOP_PAD;
    const clamped = Math.max(0, Math.min(100, pct));
    return Math.max(6, (clamped / 100) * maxHeight);
  };

  const stages = rows.map((r, i) => {
    const height = heightFor(r.pct_of_visited);
    const x = i * colWidth + barInset;
    const y = BASELINE_Y - height;
    return {
      ...r,
      x,
      y,
      width: barWidth,
      height,
      right: x + barWidth,
    };
  });

  const visited = rows[0].reached;
  const final = rows[N - 1];
  const minWidth = Math.max(860, N * 118);

  return (
    <div className="w-full overflow-x-auto pb-1">
      <div className="min-w-[var(--funnel-min-width)]" style={{ "--funnel-min-width": `${minWidth}px` } as React.CSSProperties}>
        {/* ── Headline metric ─────────────────────────────────────── */}
        <div className="mb-4">
          <div className="num text-[32px] leading-none font-semibold text-foreground">
            {formatPct(final.pct_of_visited)}
          </div>
          <div className="mt-1 text-[12px] text-muted-foreground">
            {formatInt(final.reached)} booked from {formatInt(visited)} visited
          </div>
        </div>

        {/* ── Stage labels/counts ─────────────────────────────────── */}
        <div
          className="grid border-b border-border/80"
          style={{ gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))` }}
        >
          {rows.map((r, i) => (
            <div
              key={r.label}
              className={cn(
                "min-h-[74px] px-3 pb-3",
                i > 0 && "border-l border-border",
              )}
            >
              <div className="text-[13px] font-semibold leading-snug text-foreground">
                {r.label}
              </div>
              <div className="num mt-1 text-[12px] font-medium text-muted-foreground">
                {formatInt(r.reached)}
              </div>
              <div className="num mt-0.5 text-[11px] text-muted-foreground">
                {formatPct(r.pct_of_visited)}
              </div>
            </div>
          ))}
        </div>

        {/* ── Bar funnel ──────────────────────────────────────────── */}
        <svg
          viewBox={`0 0 ${VBOX_W} ${VBOX_H}`}
          preserveAspectRatio="none"
          className="block h-[300px] w-full overflow-visible"
          aria-label="Acquisition funnel bars — visitors reaching each granular step as a share of Visited"
        >
          {Array.from({ length: N - 1 }, (_, i) => {
            const x = (i + 1) * colWidth;
            return (
              <line
                key={`divider-${i}`}
                x1={x}
                y1={0}
                x2={x}
                y2={VBOX_H}
                stroke="hsl(var(--foreground-raw))"
                strokeOpacity={0.09}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}

          {stages.slice(0, -1).map((stage, i) => {
            const next = stages[i + 1];
            const connectorPath = [
              `M ${stage.right.toFixed(2)} ${stage.y.toFixed(2)}`,
              `L ${next.x.toFixed(2)} ${next.y.toFixed(2)}`,
              `L ${next.x.toFixed(2)} ${BASELINE_Y}`,
              `L ${stage.right.toFixed(2)} ${BASELINE_Y}`,
              "Z",
            ].join(" ");

            return (
              <path
                key={`connector-${stage.label}`}
                d={connectorPath}
                fill="hsl(var(--accent-muted-raw))"
                fillOpacity={0.22}
              />
            );
          })}

          {stages.map((stage) => (
            <rect
              key={`bar-${stage.label}`}
              x={stage.x}
              y={stage.y}
              width={stage.width}
              height={stage.height}
              rx={8}
              ry={8}
              fill="hsl(var(--accent-raw))"
            />
          ))}

          <line
            x1={0}
            y1={BASELINE_Y}
            x2={VBOX_W}
            y2={BASELINE_Y}
            stroke="hsl(var(--foreground-raw))"
            strokeOpacity={0.08}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* ── Boundary drop-off chips ─────────────────────────────── */}
        <div
          className="grid border-t border-border/80"
          style={{ gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))` }}
        >
          {rows.map((r, i) => (
            <div
              key={`drop-${r.label}`}
              className={cn(
                "relative min-h-[42px] px-3 py-2",
                i > 0 && "border-l border-border",
              )}
            >
              {r.drop_from_prev_pct !== null && (
                <div
                  className="num inline-flex items-center rounded-md bg-secondary px-2 py-1 text-[11px] font-medium text-muted-foreground"
                  title={`${formatInt(r.drop_from_prev_count ?? 0)} visitors lost between ${rows[i - 1].label} and ${r.label}`}
                >
                  <span className="text-foreground/55">↓</span>
                  <span className="ml-1">−{r.drop_from_prev_pct.toFixed(1)}%</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
