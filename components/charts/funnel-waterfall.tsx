"use client";

/* ============================================================================
   charts/funnel-waterfall.tsx — horizontal bar chart of funnel-step counts.

   The Overview and Funnel pages both render this. Recharts pulls in
   browser-only APIs (window for resize, etc.) so the file is a Client
   Component. The parent Server Component fetches the data and passes it
   as a serialisable prop.

   We use a horizontal BarChart instead of Recharts' FunnelChart because
   the funnel-chart trapezoid distorts the perceived ratio between steps;
   a plain bar chart reads more honestly to a non-analyst.
   ========================================================================== */

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Row = { label: string; visitors: number };

export function FunnelWaterfall({ data }: { data: Row[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(data.length * 40, 280)}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid horizontal={false} stroke="hsl(var(--foreground-raw) / 0.06)" />
        <XAxis
          type="number"
          stroke="hsl(var(--muted-foreground-raw))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          stroke="hsl(var(--muted-foreground-raw))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={140}
        />
        <Tooltip
          cursor={{ fill: "hsl(var(--foreground-raw) / 0.04)" }}
          contentStyle={{
            background: "hsl(0 0% 100%)",
            border: "1px solid hsl(0 0% 90%)",
            borderRadius: "0.5rem",
            fontSize: 12,
          }}
          formatter={(value) => [Number(value).toLocaleString("en-CH"), "Visitors"]}
        />
        <Bar dataKey="visitors" fill="hsl(var(--accent-raw))" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
