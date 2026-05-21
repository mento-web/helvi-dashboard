/* ============================================================================
   queries/leads.ts — Recent-leads listing + KPI counters.

   Reads the recent_leads view (which already flattens visitor attribution
   onto each lead row) plus a handful of count queries the Overview KPI
   strip needs.
   ========================================================================== */

import { getSupabase } from "@/lib/supabase/server";
import { TENANT_ID } from "@/lib/tenant";

export type RecentLeadRow = {
  tenant_id: string;
  lead_id: string;
  created_at: string;
  email: string;
  gender: "women" | "men";
  eligibility: "eligible" | "borderline" | "low-bmi";
  bmi: number | null;
  booking_slot_iso: string | null;
  booking_confirmed_at: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer_url: string | null;
  landing_page: string | null;
  device_type: string | null;
};

/* ── getRecentLeads ───────────────────────────────────────────────────────
   Paginated read against the recent_leads view. The view already orders
   the underlying join on leads.created_at desc, so we just slice. */
export async function getRecentLeads(limit = 100, offset = 0): Promise<RecentLeadRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("recent_leads")
    .select("*")
    .eq("tenant_id", TENANT_ID)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)
    .returns<RecentLeadRow[]>();

  if (error) {
    console.error("[leads] getRecentLeads failed:", error.message);
    return [];
  }

  return data ?? [];
}

/* ── getKpiCounts ─────────────────────────────────────────────────────────
   The four headline numbers on the Overview KPI strip. One round trip per
   number; in practice they parallel-resolve under Server Components.

   Bookings = leads with booking_confirmed_at NOT NULL.
   Conversion = booked / visitors (uses the page_viewed count from
                funnel_daily as the visitor denominator). */
export async function getKpiCounts(days = 7): Promise<{
  visitors: number;
  leads: number;
  bookings: number;
  conversion_pct: number | null;
}> {
  const supabase = getSupabase();
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);
  const sinceDate = since.toISOString().slice(0, 10);
  const sinceTs = since.toISOString();

  /* ── visitors: sum distinct-per-day visitor counts of page_viewed ────
     Note: this overcounts visitors who returned across days. It's a
     "page views by unique-per-day visitors" metric, not a true cross-day
     unique-visitor count. Good enough for a 7d window; document so
     stakeholders don't misread. */
  const visitorsP = supabase
    .from("funnel_daily")
    .select("visitor_count")
    .eq("tenant_id", TENANT_ID)
    .eq("event_name", "page_viewed")
    .gte("day", sinceDate);

  // Leads + bookings come straight off the leads table (truthful counts).
  const leadsP = supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", TENANT_ID)
    .gte("created_at", sinceTs);

  const bookingsP = supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", TENANT_ID)
    .not("booking_confirmed_at", "is", null)
    .gte("booking_confirmed_at", sinceTs);

  const [visitorsRes, leadsRes, bookingsRes] = await Promise.all([visitorsP, leadsP, bookingsP]);

  if (visitorsRes.error) console.error("[kpi] visitors:", visitorsRes.error.message);
  if (leadsRes.error)    console.error("[kpi] leads:",    leadsRes.error.message);
  if (bookingsRes.error) console.error("[kpi] bookings:", bookingsRes.error.message);

  const visitors = (visitorsRes.data ?? []).reduce((a, r) => a + (r.visitor_count ?? 0), 0);
  const leads    = leadsRes.count ?? 0;
  const bookings = bookingsRes.count ?? 0;
  const conversion_pct = visitors > 0 ? (bookings / visitors) * 100 : null;

  return { visitors, leads, bookings, conversion_pct };
}
