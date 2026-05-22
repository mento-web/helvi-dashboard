/* ============================================================================
   app/leads/page.tsx — Recent leads.

   Last 100 leads from the recent_leads view (which already flattens
   first-touch attribution onto each lead row). No pagination UI in v1.
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
  // ISO-style for ops feel: 2026-05-22 11:43
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

export default async function LeadsPage() {
  const leads = await getRecentLeads(100);

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <div className="font-mono text-xs text-muted-foreground">/leads</div>
        <h1 className="text-base font-medium tracking-tight">Recent submissions</h1>
        <p className="text-xs text-muted-foreground max-w-3xl pt-1">
          {formatInt(leads.length)} most recent leads, newest first. Booked = confirmed Cal.com slot.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>recent_leads</CardTitle>
          <CardDescription>joined with each lead&apos;s first-touch utm source</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[860px]">
            <thead>
              <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="px-4 py-2 font-medium">created_at</th>
                <th className="px-4 py-2 font-medium">email</th>
                <th className="px-4 py-2 font-medium">gender</th>
                <th className="px-4 py-2 font-medium">eligibility</th>
                <th className="px-4 py-2 font-medium text-right">bmi</th>
                <th className="px-4 py-2 font-medium">status</th>
                <th className="px-4 py-2 font-medium">source</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-xs text-muted-foreground">
                    No leads yet.
                  </td>
                </tr>
              )}
              {leads.map((row) => (
                <tr key={row.lead_id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                    {formatDateTime(row.created_at)}
                  </td>
                  <td className="px-4 py-2">{row.email}</td>
                  <td className="px-4 py-2 font-mono text-xs lowercase">{row.gender}</td>
                  <td className="px-4 py-2">
                    <Badge variant={ELIGIBILITY_VARIANT[row.eligibility] ?? "neutral"}>
                      {row.eligibility}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-right metric">
                    {row.bmi !== null ? row.bmi.toFixed(1) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-2">
                    {row.booking_confirmed_at ? (
                      <Badge variant="booked">booked</Badge>
                    ) : (
                      <Badge variant="pending">lead</Badge>
                    )}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
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
