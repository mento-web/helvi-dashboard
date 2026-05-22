/* ============================================================================
   app/leads/page.tsx — Recent leads.

   Last 100 leads from the recent_leads view (which already flattens
   first-touch attribution onto each lead row). The actual table — with
   search, per-column sort, filter chips, and CSV export — lives in the
   <LeadsTable> client component. This page just fetches and passes data.
   ========================================================================== */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <div className="font-mono text-xs text-muted-foreground">/leads</div>
        <h1 className="text-base font-medium tracking-tight">Recent submissions</h1>
        <p className="text-xs text-muted-foreground max-w-3xl pt-1">
          {formatInt(rows.length)} most recent leads, newest first. Booked = confirmed Cal.com slot.
          Click any column header to sort or filter. Download visible rows as CSV from the top right.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>recent_leads</CardTitle>
          <CardDescription>joined with each lead&apos;s first-touch utm source</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <LeadsTable rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
