/* ============================================================================
   app/leads/page.tsx — Recent leads.

   Last 100 leads from the recent_leads view (which already flattens
   first-touch attribution onto each lead row). No pagination UI in v1 —
   100 rows is enough for stakeholders to scan; if it isn't, add a
   ?offset= search param and read it via the async searchParams API.

   IMPORTANT: this page renders raw lead emails. v1 access control is the
   Vercel password gate; once an authenticated viewer is past that gate,
   they see all leads.
   ========================================================================== */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { getRecentLeads } from "@/lib/queries/leads";
import { formatInt } from "@/lib/utils";

const ELIGIBILITY_VARIANT: Record<string, BadgeVariant> = {
  eligible:   "eligible",
  borderline: "borderline",
  "low-bmi":  "low-bmi",
};

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-CH", {
    day:   "numeric",
    month: "short",
    year:  "numeric",
    hour:  "2-digit",
    minute:"2-digit",
  });
}

export default async function LeadsPage() {
  const leads = await getRecentLeads(100);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-editorial text-4xl tracking-tight">Leads</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {formatInt(leads.length)} most recent leads, newest first. Booked leads have a
          confirmed Cal.com slot; the rest submitted an email on the eligible screen but never
          completed the booking.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent leads</CardTitle>
          <CardDescription>Joined with each lead&apos;s first-touch UTM source.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm min-w-[860px]">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2 pr-4 font-medium">Created</th>
                <th className="py-2 pr-4 font-medium">Email</th>
                <th className="py-2 pr-4 font-medium">Gender</th>
                <th className="py-2 pr-4 font-medium">Eligibility</th>
                <th className="py-2 pr-4 font-medium text-right">BMI</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    No leads yet.
                  </td>
                </tr>
              )}
              {leads.map((row) => (
                <tr key={row.lead_id} className="border-b border-border last:border-0">
                  <td className="py-2 pr-4 text-muted-foreground tabular-nums">
                    {formatDateTime(row.created_at)}
                  </td>
                  <td className="py-2 pr-4 font-medium">{row.email}</td>
                  <td className="py-2 pr-4 capitalize">{row.gender}</td>
                  <td className="py-2 pr-4">
                    <Badge variant={ELIGIBILITY_VARIANT[row.eligibility] ?? "neutral"}>
                      {row.eligibility}
                    </Badge>
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {row.bmi !== null ? row.bmi.toFixed(1) : "—"}
                  </td>
                  <td className="py-2 pr-4">
                    {row.booking_confirmed_at ? (
                      <Badge variant="booked">Booked</Badge>
                    ) : (
                      <Badge variant="pending">Lead only</Badge>
                    )}
                  </td>
                  <td className="py-2 text-muted-foreground">
                    {row.utm_source ?? "(direct)"}
                    {row.utm_medium ? ` / ${row.utm_medium}` : ""}
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
