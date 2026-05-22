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

type Row = { day: string; visitors: number; comparisonVisitors?: number };

const compact = new Intl.NumberFormat("en-CH", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function TrafficLine({ data }: { data: Row[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid vertical={false} stroke="hsl(var(--foreground-raw) / 0.07)" />
        <XAxis
          dataKey="day"
          stroke="hsl(var(--muted-foreground-raw))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
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
          tickCount={4}
          tickFormatter={(v: number) => compact.format(v)}
        />
        <Tooltip
          cursor={{ stroke: "hsl(var(--foreground-raw) / 0.2)" }}
          contentStyle={{
            background: "hsl(0 0% 100%)",
            border: "1px solid hsl(var(--foreground-raw) / 0.08)",
            borderRadius: "0.5rem",
            fontSize: 12,
            boxShadow: "0 8px 24px hsl(var(--foreground-raw) / 0.08)",
          }}
          labelFormatter={(label) =>
            new Date(String(label)).toLocaleDateString("en-CH", { day: "numeric", month: "short", year: "numeric" })
          }
          formatter={(value, name) => [
            Number(value).toLocaleString("en-CH"),
            name === "comparisonVisitors" ? "Previous period" : "Visitors",
          ]}
        />
        <Line
          type="monotone"
          dataKey="comparisonVisitors"
          stroke="hsl(var(--accent-muted-raw))"
          strokeWidth={2}
          strokeDasharray="2 5"
          dot={false}
          activeDot={false}
          strokeLinecap="round"
        />
        <Line
          type="monotone"
          dataKey="visitors"
          stroke="hsl(var(--accent-raw))"
          strokeWidth={2.75}
          dot={false}
          strokeLinecap="round"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
