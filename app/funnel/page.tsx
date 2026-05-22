/* ============================================================================
   app/funnel/page.tsx — Detailed funnel view.

   Reads the funnel_conversion view (per-visitor max step reached) and
   shows:
     - Step-by-step "reached" count (waterfall of survivors).
     - Per-step drop-off percentage as a table.
   ========================================================================== */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FunnelWaterfall } from "@/components/charts/funnel-waterfall";
import { getFunnelConversion } from "@/lib/queries/funnel";
import { formatInt, formatPct } from "@/lib/utils";

export default async function FunnelPage() {
  const conversion = await getFunnelConversion(30);

  const waterfall = conversion.map((c) => ({ label: c.label, visitors: c.reached }));

  const tableRows = conversion.map((c, i) => {
    const next = conversion[i + 1];
    const dropPct =
      next && c.reached > 0 ? ((c.reached - next.reached) / c.reached) * 100 : null;
    return {
      label: c.label,
      reached: c.reached,
      dropped: c.dropped,
      drop_to_next_pct: dropPct,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <div className="font-mono text-xs text-muted-foreground">/funnel</div>
        <h1 className="text-base font-medium tracking-tight">Per-step conversion</h1>
        <p className="text-xs text-muted-foreground max-w-3xl pt-1">
          Per-visitor furthest-step reached over the last 30 days. A visitor counts at every step
          up to and including their furthest one.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>reached / step</CardTitle>
          <CardDescription>unique visitors whose furthest event was this step or later</CardDescription>
        </CardHeader>
        <CardContent>
          <FunnelWaterfall data={waterfall} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>drop-off / step</CardTitle>
          <CardDescription>percentage of visitors at each step who did not reach the next one</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="px-4 py-2 font-medium">step</th>
                <th className="px-4 py-2 font-medium text-right">reached</th>
                <th className="px-4 py-2 font-medium text-right">stopped</th>
                <th className="px-4 py-2 font-medium text-right">drop_to_next</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, idx) => (
                <tr key={row.label} className="border-b border-border last:border-0">
                  <td className="px-4 py-2">
                    <span className="font-mono text-xs text-muted-foreground mr-2">{String(idx + 1).padStart(2, "0")}</span>
                    {row.label}
                  </td>
                  <td className="px-4 py-2 text-right metric">{formatInt(row.reached)}</td>
                  <td className="px-4 py-2 text-right metric text-muted-foreground">{formatInt(row.dropped)}</td>
                  <td className="px-4 py-2 text-right metric">
                    {row.drop_to_next_pct === null ? <span className="text-muted-foreground">—</span> : formatPct(row.drop_to_next_pct)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
