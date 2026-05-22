/* ============================================================================
   app/leads/page.tsx — Recent leads.

   Last 100 leads from the recent_leads view (which already flattens
   first-touch attribution onto each lead row). The actual table — with
   search, per-column sort, filter chips, and CSV export — lives in the
   <LeadsTable> client component. This page just fetches and passes data.
   ========================================================================== */

import { Card, CardContent, CardHeader, CardTitle, CardDescription, ExploreButton, PeriodFooter } from "@/components/ui/card";
import { DashboardPage } from "@/components/ui/dashboard-page";
import { LeadsTable, type LeadRow } from "@/components/leads/leads-table";
import { getRecentLeads } from "@/lib/queries/leads";
import { formatInt } from "@/lib/utils";

export default async function LeadsPage() {
  const leads = await getRecentLeads(100);

  // Trim to the shape the client component needs. Avoids serialising fields
  // the client doesn't read.
  const rows: LeadRow[] = leads.map((r) => ({
    lead_id: r.lead_id,
    created_at: r.created_at,
    email: r.email,
    gender: r.gender,
    eligibility: r.eligibility,
    bmi: r.bmi,
    booking_confirmed_at: r.booking_confirmed_at,
    utm_source: r.utm_source,
    utm_medium: r.utm_medium,
  }));

  return (
    <DashboardPage title="Leads" period="Latest 100">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Recent submissions</CardTitle>
            <CardDescription>{formatInt(rows.length)} most recent leads with first-touch source.</CardDescription>
          </div>
          <ExploreButton label="Recent submissions" />
        </CardHeader>
        <CardContent data-dashboard-table className="p-0">
          <LeadsTable rows={rows} />
        </CardContent>
        <PeriodFooter current="Latest 100" />
      </Card>
    </DashboardPage>
  );
}
