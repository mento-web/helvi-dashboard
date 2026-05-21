"use client";

/* ============================================================================
   charts/gender-pie.tsx — leads grouped by gender, donut-style pie.
   The Helvi survey is gendered (women / men variants) so the gender split
   is meaningful for conversion analysis.
   ========================================================================== */

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type Row = { gender: string; count: number };

const GENDER_COLORS: Record<string, string> = {
  women: "hsl(var(--tint-dusty-pink))",
  men:   "hsl(var(--tint-powder-blue))",
};

const GENDER_LABEL: Record<string, string> = {
  women: "Women",
  men:   "Men",
};

export function GenderPie({ data }: { data: Row[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="gender"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          label={(props: { payload?: { gender?: string } }) => {
            const g = props.payload?.gender;
            return g ? (GENDER_LABEL[g] ?? g) : "";
          }}
        >
          {data.map((entry) => (
            <Cell
              key={entry.gender}
              fill={GENDER_COLORS[entry.gender] ?? "hsl(var(--tint-taupe))"}
              stroke="white"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, _name, item) => {
            const g = (item as { payload?: Row })?.payload?.gender;
            const label = g ? (GENDER_LABEL[g] ?? g) : String(_name ?? "");
            return [Number(value).toLocaleString("en-CH"), label];
          }}
          contentStyle={{
            background: "hsl(0 0% 100%)",
            border: "1px solid hsl(0 0% 90%)",
            borderRadius: "0.5rem",
            fontSize: 12,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
