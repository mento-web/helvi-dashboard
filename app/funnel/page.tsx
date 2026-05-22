/* ============================================================================
   app/funnel/page.tsx — Sliceable acquisition funnel.

   Filters live in the URL search params (date range + UTM/device/landing
   + gender/eligibility/BMI band). This server component:
     1. awaits searchParams (Next 16 contract — it's a Promise)
     2. parses it into a typed FunnelFilters
     3. fetches the filtered conversion + the option universe in parallel
     4. renders the filter bar (client) above the funnel viz (server)

   The drop-off-per-step table at the bottom is unchanged: it's the
   precise numeric reference accompanying the visual funnel.
   ========================================================================== */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FunnelHorizontal, type FunnelHorizontalRow } from "@/components/funnel/funnel-horizontal";
import { FunnelFilters } from "@/components/funnel/funnel-filters";
import {
  getFunnelConversionFiltered,
  getFunnelFilterOptions,
  parseFunnelSearchParams,
} from "@/lib/queries/funnel";
import { formatInt, formatPct } from "@/lib/utils";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function FunnelPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Next 16: searchParams is a Promise. Await it before parsing.
  const spResolved = await searchParams;
  const filters = parseFunnelSearchParams(spResolved);

  // Both queries hit the same view; running them in parallel saves a
  // round-trip's worth of latency without much code cost.
  const [conversion, options] = await Promise.all([
    getFunnelConversionFiltered(filters),
    getFunnelFilterOptions(filters.from, filters.to),
  ]);

  // Anchor for "% of visited" — first canonical step is page_viewed = Visited.
  const visited = conversion[0]?.reached ?? 0;

  // Build the funnel rows: each step's share of Visited (= 100% at top) plus
  // the drop-off from the previous step. First row's drop is null.
  const funnelRows: FunnelHorizontalRow[] = conversion.map((c, i) => {
    const prev = i > 0 ? conversion[i - 1] : null;
    const dropCount = prev ? prev.reached - c.reached : null;
    const dropPct =
      prev && prev.reached > 0 ? (dropCount! / prev.reached) * 100 : null;
    return {
      label: c.label,
      reached: c.reached,
      pct_of_visited: visited > 0 ? (c.reached / visited) * 100 : 0,
      drop_from_prev_pct: dropPct,
      drop_from_prev_count: dropCount,
    };
  });

  // Companion table — same drop-off but framed step → next, plus the
  // "stopped here" count which the visual funnel doesn't show.
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
        <h1 className="text-base font-medium tracking-tight">Acquisition funnel</h1>
        <p className="text-xs text-muted-foreground max-w-3xl pt-1">
          Per-visitor furthest-step reached. Each bar is sized as a share of Visited (= 100%);
          the last bar, Booked, is the overall conversion rate. Slice with the filters below —
          state lives in the URL so the view is shareable.
        </p>
      </div>

      {/* === Filters — client component, writes to URL searchParams === */}
      <FunnelFilters filters={filters} options={options} />

      <Card>
        <CardHeader>
          <CardTitle>visited → booked</CardTitle>
          <CardDescription>
            % of visited at each step, with stage-to-stage drop-off between bars
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <FunnelHorizontal rows={funnelRows} />
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
