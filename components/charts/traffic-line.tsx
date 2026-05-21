"use client";

/* ============================================================================
   charts/traffic-line.tsx — daily visitor count, line chart.
   Drives the Overview's "Traffic, last 30 days" panel.
   ========================================================================== */

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Row = { day: string; visitors: number };

export function TrafficLine({ data }: { data: Row[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid stroke="hsl(var(--foreground-raw) / 0.06)" />
        <XAxis
          dataKey="day"
          stroke="hsl(var(--muted-foreground-raw))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: string) => {
            // 'YYYY-MM-DD' → 'D MMM'
            const d = new Date(v);
            return d.toLocaleDateString("en-CH", { day: "numeric", month: "short" });
          }}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground-raw))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ stroke: "hsl(var(--foreground-raw) / 0.2)" }}
          contentStyle={{
            background: "hsl(0 0% 100%)",
            border: "1px solid hsl(0 0% 90%)",
            borderRadius: "0.5rem",
            fontSize: 12,
          }}
          labelFormatter={(label) =>
            new Date(String(label)).toLocaleDateString("en-CH", { day: "numeric", month: "short", year: "numeric" })
          }
          formatter={(value) => [Number(value).toLocaleString("en-CH"), "Visitors"]}
        />
        <Line
          type="monotone"
          dataKey="visitors"
          stroke="hsl(var(--accent-raw))"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
