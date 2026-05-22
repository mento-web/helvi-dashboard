"use client";

/* ============================================================================
   charts/gender-pie.tsx — leads grouped by gender, donut-style pie.
   The Helvi survey is gendered (women / men variants) so the gender split
   is meaningful for conversion analysis.
   ========================================================================== */

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type Row = { gender: string; count: number };

const GENDER_COLORS: Record<string, string> = {
  women: "hsl(238 45% 56%)",
  men:   "hsl(217 84% 51%)",
};

const GENDER_LABEL: Record<string, string> = {
  women: "Women",
  men:   "Men",
};

export function GenderPie({ data }: { data: Row[] }) {
  const total = data.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="grid min-h-[260px] grid-cols-1 items-center gap-4 sm:grid-cols-[minmax(0,1fr)_160px]">
      <div className="relative h-[250px] min-w-0">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="gender"
              innerRadius={66}
              outerRadius={100}
              paddingAngle={2}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.gender}
                  fill={GENDER_COLORS[entry.gender] ?? "hsl(217 60% 70%)"}
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
                border: "1px solid hsl(var(--foreground-raw) / 0.08)",
                borderRadius: "0.5rem",
                fontSize: 12,
                boxShadow: "0 8px 24px hsl(var(--foreground-raw) / 0.08)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="num text-[28px] leading-none font-semibold text-foreground">
              {total.toLocaleString("en-CH")}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">Leads</div>
          </div>
        </div>
      </div>
      <div className="space-y-2 text-[13px]">
        {data.map((row) => (
          <div key={row.gender} className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: GENDER_COLORS[row.gender] ?? "hsl(217 60% 70%)" }}
                aria-hidden
              />
              <span>{GENDER_LABEL[row.gender] ?? row.gender}</span>
            </span>
            <span className="num font-medium text-foreground">{row.count.toLocaleString("en-CH")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
