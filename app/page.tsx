/* ============================================================================
   app/page.tsx — Overview.

   The top-level dashboard surface stakeholders see first. Layout:

     1. Page header (route label + section title).
     2. KPI strip (4 tiles): visitors 7d, leads 7d, bookings 7d, conversion %.
     3. Two side-by-side panels:
        - "funnel" — horizontal waterfall of step counts.
        - "traffic" — daily visitor line.

   Server Component. Data is fetched in parallel via Promise.all.
   ========================================================================== */

import { Card, CardContent, CardHeader, CardTitle, CardDescription, ExploreButton, PeriodFooter } from "@/components/ui/card";
import { KpiTile } from "@/components/ui/kpi-tile";
import { DashboardPage } from "@/components/ui/dashboard-page";
import { FunnelWaterfall } from "@/components/charts/funnel-waterfall";
import { Sparkline } from "@/components/charts/sparkline";
import { TrafficLine } from "@/components/charts/traffic-line";
import { getFunnelByStep, getTrafficDailyComparison } from "@/lib/queries/funnel";
import { getKpiComparison, getKpiTrends } from "@/lib/queries/leads";
import { formatInt, formatPct } from "@/lib/utils";

export default async function OverviewPage() {
  // === Parallel fetch of everything the page needs ===
  const [kpi, trends, funnel, traffic] = await Promise.all([
    getKpiComparison(7),
    getKpiTrends(7),
    getFunnelByStep(30),
    getTrafficDailyComparison(30),
  ]);

  return (
    <DashboardPage title="Overview" period="Last 30 days">
      {/* === KPI strip === */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          label="Visitors"
          value={formatInt(kpi.current.visitors)}
          delta={kpi.delta.visitors}
          hint="Last 7 days"
          comparisonHint="Previous 7 days"
          sparkline={<Sparkline values={trends.visitors} />}
        />
        <KpiTile
          label="Leads"
          value={formatInt(kpi.current.leads)}
          delta={kpi.delta.leads}
          hint="Last 7 days"
          comparisonHint="Previous 7 days"
          sparkline={<Sparkline values={trends.leads} />}
        />
        <KpiTile
          label="Bookings"
          value={formatInt(kpi.current.bookings)}
          delta={kpi.delta.bookings}
          hint="Last 7 days"
          comparisonHint="Previous 7 days"
          sparkline={<Sparkline values={trends.bookings} />}
        />
        <KpiTile
          label="Visit to booked"
          value={formatPct(kpi.current.conversion_pct)}
          delta={kpi.delta.conversion_pct}
          hint="Last 7 days"
          comparisonHint="Previous 7 days"
          sparkline={<Sparkline values={trends.conversion_pct} />}
        />
      </div>

      {/* === 12-column chart row === */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardHeader>
            <div>
              <CardTitle>Total visitors</CardTitle>
              <CardDescription>Unique-per-day visitors for the acquisition entry event.</CardDescription>
            </div>
            <ExploreButton label="Total visitors" />
          </CardHeader>
          <CardContent>
            <TrafficLine data={traffic} />
          </CardContent>
          <PeriodFooter current="Last 30 days" comparison="Previous 30 days" />
        </Card>

        <Card className="xl:col-span-4">
          <CardHeader>
            <div>
              <CardTitle>Visitors by step</CardTitle>
              <CardDescription>Distinct-per-day visitor count at each canonical step.</CardDescription>
            </div>
            <ExploreButton label="Visitors by step" />
          </CardHeader>
          <CardContent>
            <FunnelWaterfall data={funnel} />
          </CardContent>
          <PeriodFooter current="Last 30 days" />
        </Card>
      </div>
    </DashboardPage>
  );
}
