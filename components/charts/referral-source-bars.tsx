/* ============================================================================
   charts/referral-source-bars.tsx — Referral-source bar chart.

   Server-rendered SVG so the sources page does not need client chart JS for a
   simple ranking view. Matches the funnel bars: blue primary bars, quiet grid,
   tabular values, and horizontally scrollable columns when labels need room.
   ========================================================================== */

import * as React from "react";
import { formatCompact, formatInt } from "@/lib/utils";

export type ReferralSourceBarRow = {
  source: string;
  visitors: number;
};

const VBOX_W = 1000;
const VBOX_H = 360;
const PLOT_TOP = 18;
const PLOT_RIGHT = 20;
const PLOT_BOTTOM = 56;
const PLOT_LEFT = 56;
const GRID_LINES = 5;

export function ReferralSourceBars({ rows }: { rows: ReferralSourceBarRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="flex h-[360px] items-center justify-center text-sm text-muted-foreground">
        No traffic recorded yet.
      </div>
    );
  }

  const maxVisitors = Math.max(...rows.map((row) => row.visitors), 1);
  const plotWidth = VBOX_W - PLOT_LEFT - PLOT_RIGHT;
  const plotHeight = VBOX_H - PLOT_TOP - PLOT_BOTTOM;
  const colWidth = plotWidth / rows.length;
  const barWidth = Math.min(colWidth * 0.72, 88);
  const minWidth = Math.max(760, rows.length * 112);

  return (
    <div className="w-full overflow-x-auto pb-1">
      <div
        className="min-w-[var(--source-chart-min-width)]"
        style={{ "--source-chart-min-width": `${minWidth}px` } as React.CSSProperties}
      >
        <svg
          viewBox={`0 0 ${VBOX_W} ${VBOX_H}`}
          preserveAspectRatio="none"
          className="block h-[360px] w-full overflow-visible"
          aria-label="Referral source visitor counts"
        >
          {Array.from({ length: GRID_LINES }, (_, i) => {
            const ratio = i / (GRID_LINES - 1);
            const y = PLOT_TOP + ratio * plotHeight;
            const value = maxVisitors * (1 - ratio);

            return (
              <g key={`grid-${i}`}>
                <line
                  x1={PLOT_LEFT}
                  y1={y}
                  x2={VBOX_W - PLOT_RIGHT}
                  y2={y}
                  stroke="hsl(var(--foreground-raw))"
                  strokeOpacity={0.08}
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
                {i < GRID_LINES - 1 && (
                  <text
                    x={PLOT_LEFT - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-muted-foreground text-[11px]"
                  >
                    {formatCompact(value)}
                  </text>
                )}
              </g>
            );
          })}

          <line
            x1={PLOT_LEFT}
            y1={PLOT_TOP + plotHeight}
            x2={VBOX_W - PLOT_RIGHT}
            y2={PLOT_TOP + plotHeight}
            stroke="hsl(var(--foreground-raw))"
            strokeOpacity={0.14}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />

          {rows.map((row, i) => {
            const height = Math.max(4, (row.visitors / maxVisitors) * plotHeight);
            const x = PLOT_LEFT + i * colWidth + (colWidth - barWidth) / 2;
            const y = PLOT_TOP + plotHeight - height;

            return (
              <g key={row.source}>
                <title>{`${row.source}: ${formatInt(row.visitors)} visitors`}</title>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={height}
                  rx={6}
                  ry={6}
                  fill="hsl(var(--accent-raw))"
                />
                <text
                  x={x + barWidth / 2}
                  y={PLOT_TOP + plotHeight + 30}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[13px] font-medium"
                >
                  {row.source}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
