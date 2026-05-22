/* ============================================================================
   app/sources/page.tsx — Traffic attribution.

   Renders the traffic_sources view as a dense table. Sort order is
   visitor_count desc from the view; no client-side resort in v1.
   ========================================================================== */

import { Card, CardContent, CardHeader, CardTitle, CardDescription, ExploreButton, PeriodFooter } from "@/components/ui/card";
import { DashboardPage } from "@/components/ui/dashboard-page";
import { getTrafficSources } from "@/lib/queries/sources";
import { formatInt, formatPct } from "@/lib/utils";

export default async function SourcesPage() {
  const sources = await getTrafficSources(50);

  return (
    <DashboardPage title="Sources" period="All time">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Top sources</CardTitle>
            <CardDescription>First-touch attribution by visitor count and booking conversion.</CardDescription>
          </div>
          <ExploreButton label="Top sources" />
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-border text-left text-[12px] font-medium text-muted-foreground">
                <th className="px-5 py-2.5 font-medium">Source</th>
                <th className="px-5 py-2.5 font-medium">Medium</th>
                <th className="px-5 py-2.5 font-medium">Campaign</th>
                <th className="px-5 py-2.5 font-medium text-right">Visitors</th>
                <th className="px-5 py-2.5 font-medium text-right">Leads</th>
                <th className="px-5 py-2.5 font-medium text-right">Booked</th>
                <th className="px-5 py-2.5 font-medium text-right">V to B</th>
              </tr>
            </thead>
            <tbody>
              {sources.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-muted-foreground">
                    No traffic recorded yet.
                  </td>
                </tr>
              )}
              {sources.map((row, idx) => (
                <tr
                  key={`${row.utm_source}|${row.utm_medium}|${row.utm_campaign}|${row.referrer_url}|${idx}`}
                  className="border-b border-border last:border-0 hover:bg-muted/45"
                >
                  <td className="px-5 py-3 font-medium">{row.utm_source}</td>
                  <td className="px-5 py-3 text-muted-foreground">{row.utm_medium}</td>
                  <td className="px-5 py-3 text-muted-foreground">{row.utm_campaign}</td>
                  <td className="px-5 py-3 text-right num">{formatInt(row.visitor_count)}</td>
                  <td className="px-5 py-3 text-right num">{formatInt(row.lead_count)}</td>
                  <td className="px-5 py-3 text-right num">{formatInt(row.booked_count)}</td>
                  <td className="px-5 py-3 text-right num">{formatPct(row.visitor_to_booked_pct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
        <PeriodFooter current="All time" />
      </Card>
    </DashboardPage>
  );
}
