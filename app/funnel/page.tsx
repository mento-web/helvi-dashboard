/* ============================================================================
   app/funnel/page.tsx — Detailed funnel view.

   Reads the funnel_conversion view (per-visitor max step reached) and
   shows:
     - Step-by-step "reached" count (waterfall of survivors).
     - Per-step drop-off percentage as a table.

   The reached counts answer "how many visitors got at least this far"
   which is what you want for funnel-shaped analysis. The waterfall on
   the Overview page sums distinct-per-day counts, which is more like a
   raw activity feed — different metric, different chart.
   ========================================================================== */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FunnelWaterfall } from "@/components/charts/funnel-waterfall";
import { getFunnelConversion } from "@/lib/queries/funnel";
import { formatInt, formatPct } from "@/lib/utils";

export default async function FunnelPage() {
  const conversion = await getFunnelConversion(30);

  // Reshape for the waterfall: each step's "reached" count.
  const waterfall = conversion.map((c) => ({ label: c.label, visitors: c.reached }));

  // Drop-off table: from one step to the next.
  // step N→N+1 drop = (reached_N - reached_{N+1}) / reached_N
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
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-editorial text-4xl tracking-tight">Funnel</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Per-visitor furthest-step reached over the last 30 days. A visitor counts at every
          step up to and including their furthest one.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visitors reaching each step</CardTitle>
          <CardDescription>
            Count of unique visitors whose furthest event was this step or later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FunnelWaterfall data={waterfall} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Drop-off table</CardTitle>
          <CardDescription>
            Percentage of visitors at each step who did not reach the next one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2 pr-4 font-medium">Step</th>
                <th className="py-2 pr-4 font-medium text-right">Reached</th>
                <th className="py-2 pr-4 font-medium text-right">Stopped here</th>
                <th className="py-2 font-medium text-right">Drop to next</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, idx) => (
                <tr key={row.label} className="border-b border-border last:border-0">
                  <td className="py-2 pr-4">
                    <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                    {row.label}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">{formatInt(row.reached)}</td>
                  <td className="py-2 pr-4 text-right tabular-nums text-muted-foreground">
                    {formatInt(row.dropped)}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {row.drop_to_next_pct === null ? "—" : formatPct(row.drop_to_next_pct)}
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
