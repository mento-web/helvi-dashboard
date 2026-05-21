"use client";

/* ============================================================================
   charts/eligibility-bar.tsx — leads vs booked leads per eligibility band.
   Stacked-pair bar; lets stakeholders see "we get lots of borderline
   leads but they don't convert" vs "eligible leads book at a high rate."
   ========================================================================== */

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Row = { eligibility: string; count: number; booked: number };

const LABEL: Record<string, string> = {
  eligible:   "Eligible",
  borderline: "Borderline",
  "low-bmi":  "Low BMI",
};

export function EligibilityBar({ data }: { data: Row[] }) {
  const reshaped = data.map((r) => ({
    name: LABEL[r.eligibility] ?? r.eligibility,
    Leads: r.count,
    Booked: r.booked,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={reshaped} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid vertical={false} stroke="hsl(var(--foreground-raw) / 0.06)" />
        <XAxis
          dataKey="name"
          stroke="hsl(var(--muted-foreground-raw))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
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
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Leads"  fill="hsl(var(--tint-taupe))"   radius={[4, 4, 0, 0]} />
        <Bar dataKey="Booked" fill="hsl(var(--accent-raw))"   radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
