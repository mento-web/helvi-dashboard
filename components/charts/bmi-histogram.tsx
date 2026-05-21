"use client";

/* ============================================================================
   charts/bmi-histogram.tsx — leads grouped by WHO BMI bucket.
   Vertical bar chart with the canonical bucket order on the x-axis.
   ========================================================================== */

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Row = { bucket: string; label: string; count: number };

export function BmiHistogram({ data }: { data: Row[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid vertical={false} stroke="hsl(var(--foreground-raw) / 0.06)" />
        <XAxis
          dataKey="label"
          stroke="hsl(var(--muted-foreground-raw))"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          angle={-15}
          textAnchor="end"
          height={60}
          interval={0}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground-raw))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ fill: "hsl(var(--foreground-raw) / 0.04)" }}
          contentStyle={{
            background: "hsl(0 0% 100%)",
            border: "1px solid hsl(0 0% 90%)",
            borderRadius: "0.5rem",
            fontSize: 12,
          }}
          formatter={(value) => [Number(value).toLocaleString("en-CH"), "Leads"]}
        />
        <Bar dataKey="count" fill="hsl(var(--tint-lavender))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
