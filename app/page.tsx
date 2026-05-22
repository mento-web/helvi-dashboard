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

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KpiTile } from "@/components/ui/kpi-tile";
import { FunnelWaterfall } from "@/components/charts/funnel-waterfall";
import { TrafficLine } from "@/components/charts/traffic-line";
import { getFunnelByStep, getTrafficDaily } from "@/lib/queries/funnel";
import { getKpiCounts } from "@/lib/queries/leads";
import { formatInt, formatPct } from "@/lib/utils";

export default async function OverviewPage() {
  // === Parallel fetch of everything the page needs ===
  const [kpi, funnel, traffic] = await Promise.all([
    getKpiCounts(7),
    getFunnelByStep(30),
    getTrafficDaily(30),
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* === Page header === */}
      <div className="space-y-1">
        <div className="font-mono text-xs text-muted-foreground">/overview</div>
        <h1 className="text-base font-medium tracking-tight">Funnel summary</h1>
        <p className="text-xs text-muted-foreground max-w-3xl pt-1">
          KPIs cover the last 7 days. Charts cover the last 30. Visitor counts are
          unique-per-day; cross-day uniqueness is approximated by summing per-day distincts.
        </p>
      </div>

      {/* === KPI strip === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiTile tint="powder-blue" label="visitors / 7d"   value={formatInt(kpi.visitors)} hint="unique per day, page_viewed" />
        <KpiTile tint="lavender"    label="leads / 7d"      value={formatInt(kpi.leads)}    hint="email submitted on /eligible" />
        <KpiTile tint="moss"        label="bookings / 7d"   value={formatInt(kpi.bookings)} hint="cal.com confirmations" />
        <KpiTile tint="peach"       label="conversion / 7d" value={formatPct(kpi.conversion_pct)} hint="bookings ÷ visitors" />
      </div>

      {/* === Two-column chart row === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>funnel / 30d</CardTitle>
            <CardDescription>distinct-per-day visitor count at each canonical step</CardDescription>
          </CardHeader>
          <CardContent>
            <FunnelWaterfall data={funnel} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>traffic / 30d</CardTitle>
            <CardDescription>unique visitors per day, page_viewed</CardDescription>
          </CardHeader>
          <CardContent>
            <TrafficLine data={traffic} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
