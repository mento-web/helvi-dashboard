/* ============================================================================
   app/page.tsx — Overview.

   The top-level dashboard surface stakeholders see first. Layout:

     1. Page header (title + sub).
     2. KPI strip (4 tiles): visitors 7d, leads 7d, bookings 7d, conversion %.
     3. Two side-by-side panels:
        - "Funnel, last 30 days" — horizontal waterfall of step counts.
        - "Traffic, last 30 days" — daily visitor line.

   Server Component. Data is fetched in parallel via Promise.all to keep
   the TTFB tight. The two chart panels each receive a serialised data
   prop and render Recharts on the client.
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
    <div className="flex flex-col gap-8">
      {/* === Page header === */}
      <div>
        <h1 className="font-editorial text-4xl tracking-tight">Overview</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Helvi funnel, last 7 days for KPIs and last 30 days for charts. All counts are unique
          visitors per day; cross-day uniqueness is approximated.
        </p>
      </div>

      {/* === KPI strip === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile
          tint="powder-blue"
          label="Visitors (7d)"
          value={formatInt(kpi.visitors)}
          hint="Unique-per-day, page_viewed events"
        />
        <KpiTile
          tint="lavender"
          label="Leads (7d)"
          value={formatInt(kpi.leads)}
          hint="Emails submitted on the eligible screen"
        />
        <KpiTile
          tint="moss"
          label="Bookings (7d)"
          value={formatInt(kpi.bookings)}
          hint="Cal.com confirmations"
        />
        <KpiTile
          tint="peach"
          label="Conversion (7d)"
          value={formatPct(kpi.conversion_pct)}
          hint="Bookings ÷ visitors"
        />
      </div>

      {/* === Two-column chart row ===
          On narrow screens these stack. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Funnel, last 30 days</CardTitle>
            <CardDescription>
              Distinct-per-day visitor count at each canonical step.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FunnelWaterfall data={funnel} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Traffic, last 30 days</CardTitle>
            <CardDescription>Unique visitors per day, from page_viewed.</CardDescription>
          </CardHeader>
          <CardContent>
            <TrafficLine data={traffic} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
