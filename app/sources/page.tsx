/* ============================================================================
   app/sources/page.tsx — Traffic attribution.

   Renders a source-ranking bar chart first, then the detailed traffic_sources
   table below it. The table keeps the raw medium/campaign buckets; the chart
   aggregates those buckets by source for a cleaner referral overview.
   ========================================================================== */

import { Card, CardContent, CardHeader, CardTitle, CardDescription, ExploreButton, PeriodFooter } from "@/components/ui/card";
import { DashboardPage } from "@/components/ui/dashboard-page";
import { ReferralSourceBars, type ReferralSourceBarRow } from "@/components/charts/referral-source-bars";
import { getTrafficSources } from "@/lib/queries/sources";
import { formatInt, formatPct } from "@/lib/utils";

export default async function SourcesPage() {
  const sources = await getTrafficSources(50);
  const chartRows = buildSourceChartRows(sources);

  return (
    <DashboardPage title="Sources" period="All time">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Referral source</CardTitle>
            <CardDescription>First-touch visitors grouped by source.</CardDescription>
          </div>
          <ExploreButton label="Referral source" />
        </CardHeader>
        <CardContent>
          <ReferralSourceBars rows={chartRows} />
        </CardContent>
        <PeriodFooter current="All time" />
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Source details</CardTitle>
            <CardDescription>First-touch attribution by visitor count and booking conversion.</CardDescription>
          </div>
          <ExploreButton label="Source details" />
        </CardHeader>
        <CardContent data-dashboard-table className="p-0 overflow-x-auto">
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

function buildSourceChartRows(sources: Awaited<ReturnType<typeof getTrafficSources>>): ReferralSourceBarRow[] {
  const bySource = new Map<string, number>();

  for (const row of sources) {
    const source = sourceLabel(row.utm_source, row.referrer_url);
    bySource.set(source, (bySource.get(source) ?? 0) + row.visitor_count);
  }

  return Array.from(bySource, ([source, visitors]) => ({ source, visitors }))
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, 8);
}

function sourceLabel(utmSource: string, referrerUrl: string): string {
  const source = utmSource?.trim();
  if (source && source !== "unknown" && source !== "(not set)") {
    return source.toLowerCase();
  }

  try {
    const host = new URL(referrerUrl).hostname.replace(/^www\./, "");
    return host.split(".")[0] || "direct";
  } catch {
    return "direct";
  }
}
