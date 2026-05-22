/* ============================================================================
   app/sources/page.tsx — Traffic attribution.

   Renders the traffic_sources view as a dense table. Sort order is
   visitor_count desc from the view; no client-side resort in v1.
   ========================================================================== */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getTrafficSources } from "@/lib/queries/sources";
import { formatInt, formatPct } from "@/lib/utils";

export default async function SourcesPage() {
  const sources = await getTrafficSources(50);

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <div className="font-mono text-xs text-muted-foreground">/sources</div>
        <h1 className="text-base font-medium tracking-tight">First-touch attribution</h1>
        <p className="text-xs text-muted-foreground max-w-3xl pt-1">
          Top 50 source / medium / campaign / referrer combinations by visitor count. V→B is the
          conversion rate from initial visit to confirmed booking, attributed to the first-touch
          source.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>top sources</CardTitle>
          <CardDescription>
            &quot;(direct)&quot; = no UTM source present. &quot;(none)&quot; = present but blank.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="px-4 py-2 font-medium">source</th>
                <th className="px-4 py-2 font-medium">medium</th>
                <th className="px-4 py-2 font-medium">campaign</th>
                <th className="px-4 py-2 font-medium text-right">visitors</th>
                <th className="px-4 py-2 font-medium text-right">leads</th>
                <th className="px-4 py-2 font-medium text-right">booked</th>
                <th className="px-4 py-2 font-medium text-right">v→b</th>
              </tr>
            </thead>
            <tbody>
              {sources.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-xs text-muted-foreground">
                    No traffic recorded yet.
                  </td>
                </tr>
              )}
              {sources.map((row, idx) => (
                <tr
                  key={`${row.utm_source}|${row.utm_medium}|${row.utm_campaign}|${row.referrer_url}|${idx}`}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-2 font-mono text-xs">{row.utm_source}</td>
                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{row.utm_medium}</td>
                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{row.utm_campaign}</td>
                  <td className="px-4 py-2 text-right metric">{formatInt(row.visitor_count)}</td>
                  <td className="px-4 py-2 text-right metric">{formatInt(row.lead_count)}</td>
                  <td className="px-4 py-2 text-right metric">{formatInt(row.booked_count)}</td>
                  <td className="px-4 py-2 text-right metric">{formatPct(row.visitor_to_booked_pct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
