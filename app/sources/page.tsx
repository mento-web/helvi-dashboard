/* ============================================================================
   app/sources/page.tsx — Traffic attribution.

   Renders the traffic_sources view as a sortable-ish table. Sort order is
   visitor_count desc out of the database; no client-side resorting in v1.

   The view's visitor_to_booked_pct is the conversion rate from
   first-touch visit to confirmed booking, which is the metric stakeholders
   actually care about ("which source produces booked patients").
   ========================================================================== */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getTrafficSources } from "@/lib/queries/sources";
import { formatInt, formatPct } from "@/lib/utils";

export default async function SourcesPage() {
  const sources = await getTrafficSources(50);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-editorial text-4xl tracking-tight">Sources</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          First-touch attribution. Top 50 source/medium/campaign/referrer combinations by visitor
          count. Visitor→Booked is the conversion rate from initial visit to confirmed Cal.com
          booking, attributed to the first-touch source.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top sources</CardTitle>
          <CardDescription>
            &quot;(direct)&quot; means no UTM source present; &quot;(none)&quot; means present but blank.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2 pr-4 font-medium">Source</th>
                <th className="py-2 pr-4 font-medium">Medium</th>
                <th className="py-2 pr-4 font-medium">Campaign</th>
                <th className="py-2 pr-4 font-medium text-right">Visitors</th>
                <th className="py-2 pr-4 font-medium text-right">Leads</th>
                <th className="py-2 pr-4 font-medium text-right">Booked</th>
                <th className="py-2 font-medium text-right">V → B</th>
              </tr>
            </thead>
            <tbody>
              {sources.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    No traffic recorded yet.
                  </td>
                </tr>
              )}
              {sources.map((row, idx) => (
                <tr
                  key={`${row.utm_source}|${row.utm_medium}|${row.utm_campaign}|${row.referrer_url}|${idx}`}
                  className="border-b border-border last:border-0"
                >
                  <td className="py-2 pr-4 font-medium">{row.utm_source}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{row.utm_medium}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{row.utm_campaign}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{formatInt(row.visitor_count)}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{formatInt(row.lead_count)}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{formatInt(row.booked_count)}</td>
                  <td className="py-2 text-right tabular-nums">{formatPct(row.visitor_to_booked_pct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
