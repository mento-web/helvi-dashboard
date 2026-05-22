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

const compact = new Intl.NumberFormat("en-CH", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function EligibilityBar({ data }: { data: Row[] }) {
  const reshaped = data.map((r) => ({
    name: LABEL[r.eligibility] ?? r.eligibility,
    Leads: r.count,
    Booked: r.booked,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={reshaped} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid vertical={false} stroke="hsl(var(--foreground-raw) / 0.07)" />
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
          tickCount={4}
          tickFormatter={(v: number) => compact.format(v)}
        />
        <Tooltip
          cursor={{ fill: "hsl(var(--foreground-raw) / 0.04)" }}
          contentStyle={{
            background: "hsl(0 0% 100%)",
            border: "1px solid hsl(var(--foreground-raw) / 0.08)",
            borderRadius: "0.5rem",
            fontSize: 12,
            boxShadow: "0 8px 24px hsl(var(--foreground-raw) / 0.08)",
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Leads"  fill="hsl(var(--accent-muted-raw) / 0.35)" radius={[5, 5, 0, 0]} />
        <Bar dataKey="Booked" fill="hsl(var(--accent-raw))" radius={[5, 5, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
