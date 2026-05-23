/* ============================================================================
   queries/leads.ts — Recent-leads listing + KPI counters.

   Reads the recent_leads view (which already flattens visitor attribution
   onto each lead row) plus a handful of count queries the Overview KPI
   strip needs.
   ========================================================================== */

import { getSupabase } from "@/lib/supabase/server";
import { TENANT_ID } from "@/lib/tenant";
import { deltaPct } from "@/lib/utils";
import type { DashboardDateRange } from "@/lib/date-range";

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
export async function getRecentLeads(
  limit = 100,
  offset = 0,
  filters?: {
    range?: DashboardDateRange;
    gender?: string[];
    eligibility?: string[];
  },
): Promise<RecentLeadRow[]> {
  const supabase = getSupabase();
  let query = supabase
    .from("recent_leads")
    .select("*")
    .eq("tenant_id", TENANT_ID)
    .order("created_at", { ascending: false });

  if (filters?.range) {
    query = query
      .gte("created_at", `${filters.range.from}T00:00:00.000Z`)
      .lt("created_at", `${filters.range.to}T00:00:00.000Z`);
  }
  if (filters?.gender?.length) query = query.in("gender", filters.gender);
  if (filters?.eligibility?.length) query = query.in("eligibility", filters.eligibility);

  const { data, error } = await query
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

type KpiCounts = {
  visitors: number;
  leads: number;
  bookings: number;
  conversion_pct: number | null;
};

type KpiComparison = {
  current: KpiCounts;
  previous: KpiCounts;
  delta: {
    visitors: number | null;
    leads: number | null;
    bookings: number | null;
    conversion_pct: number | null;
  };
};

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function getKpiCountsForRange(from: Date, to: Date): Promise<KpiCounts> {
  const supabase = getSupabase();
  const fromDate = dayKey(from);
  const toDate = dayKey(to);
  const fromTs = from.toISOString();
  const toTs = to.toISOString();

  const visitorsP = supabase
    .from("funnel_daily")
    .select("visitor_count")
    .eq("tenant_id", TENANT_ID)
    .eq("event_name", "page_viewed")
    .gte("day", fromDate)
    .lt("day", toDate);

  const leadsP = supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", TENANT_ID)
    .gte("created_at", fromTs)
    .lt("created_at", toTs);

  const bookingsP = supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", TENANT_ID)
    .not("booking_confirmed_at", "is", null)
    .gte("booking_confirmed_at", fromTs)
    .lt("booking_confirmed_at", toTs);

  const [visitorsRes, leadsRes, bookingsRes] = await Promise.all([visitorsP, leadsP, bookingsP]);

  if (visitorsRes.error) console.error("[kpi] visitors range:", visitorsRes.error.message);
  if (leadsRes.error) console.error("[kpi] leads range:", leadsRes.error.message);
  if (bookingsRes.error) console.error("[kpi] bookings range:", bookingsRes.error.message);

  const visitors = (visitorsRes.data ?? []).reduce((a, r) => a + (r.visitor_count ?? 0), 0);
  const leads = leadsRes.count ?? 0;
  const bookings = bookingsRes.count ?? 0;
  const conversion_pct = visitors > 0 ? (bookings / visitors) * 100 : null;

  return { visitors, leads, bookings, conversion_pct };
}

export async function getKpiComparison(days = 7): Promise<KpiComparison> {
  const currentEnd = startOfUtcDay(addDays(new Date(), 1));
  const currentStart = addDays(currentEnd, -days);
  const previousStart = addDays(currentStart, -days);

  const [current, previous] = await Promise.all([
    getKpiCountsForRange(currentStart, currentEnd),
    getKpiCountsForRange(previousStart, currentStart),
  ]);

  return {
    current,
    previous,
    delta: {
      visitors: deltaPct(current.visitors, previous.visitors),
      leads: deltaPct(current.leads, previous.leads),
      bookings: deltaPct(current.bookings, previous.bookings),
      conversion_pct: deltaPct(current.conversion_pct, previous.conversion_pct),
    },
  };
}

export async function getKpiTrends(days = 7): Promise<{
  visitors: number[];
  leads: number[];
  bookings: number[];
  conversion_pct: number[];
}> {
  const supabase = getSupabase();
  const end = startOfUtcDay(addDays(new Date(), 1));
  const start = addDays(end, -days);
  const fromDate = dayKey(start);
  const toDate = dayKey(end);
  const fromTs = start.toISOString();
  const toTs = end.toISOString();
  const dates = Array.from({ length: days }, (_, i) => dayKey(addDays(start, i)));

  const visitorsP = supabase
    .from("funnel_daily")
    .select("day, visitor_count")
    .eq("tenant_id", TENANT_ID)
    .eq("event_name", "page_viewed")
    .gte("day", fromDate)
    .lt("day", toDate)
    .returns<Array<{ day: string; visitor_count: number }>>();

  const leadsP = supabase
    .from("leads")
    .select("created_at")
    .eq("tenant_id", TENANT_ID)
    .gte("created_at", fromTs)
    .lt("created_at", toTs)
    .returns<Array<{ created_at: string }>>();

  const bookingsP = supabase
    .from("leads")
    .select("booking_confirmed_at")
    .eq("tenant_id", TENANT_ID)
    .not("booking_confirmed_at", "is", null)
    .gte("booking_confirmed_at", fromTs)
    .lt("booking_confirmed_at", toTs)
    .returns<Array<{ booking_confirmed_at: string | null }>>();

  const [visitorsRes, leadsRes, bookingsRes] = await Promise.all([visitorsP, leadsP, bookingsP]);

  if (visitorsRes.error) console.error("[kpi] visitor trend:", visitorsRes.error.message);
  if (leadsRes.error) console.error("[kpi] lead trend:", leadsRes.error.message);
  if (bookingsRes.error) console.error("[kpi] booking trend:", bookingsRes.error.message);

  const visitorsByDay = new Map(dates.map((d) => [d, 0]));
  const leadsByDay = new Map(dates.map((d) => [d, 0]));
  const bookingsByDay = new Map(dates.map((d) => [d, 0]));

  for (const row of visitorsRes.data ?? []) {
    visitorsByDay.set(row.day, (visitorsByDay.get(row.day) ?? 0) + (row.visitor_count ?? 0));
  }
  for (const row of leadsRes.data ?? []) {
    const key = row.created_at.slice(0, 10);
    if (leadsByDay.has(key)) leadsByDay.set(key, (leadsByDay.get(key) ?? 0) + 1);
  }
  for (const row of bookingsRes.data ?? []) {
    if (!row.booking_confirmed_at) continue;
    const key = row.booking_confirmed_at.slice(0, 10);
    if (bookingsByDay.has(key)) bookingsByDay.set(key, (bookingsByDay.get(key) ?? 0) + 1);
  }

  const visitors = dates.map((d) => visitorsByDay.get(d) ?? 0);
  const leads = dates.map((d) => leadsByDay.get(d) ?? 0);
  const bookings = dates.map((d) => bookingsByDay.get(d) ?? 0);
  const conversion_pct = dates.map((d) => {
    const visitorCount = visitorsByDay.get(d) ?? 0;
    return visitorCount > 0 ? ((bookingsByDay.get(d) ?? 0) / visitorCount) * 100 : 0;
  });

  return { visitors, leads, bookings, conversion_pct };
}
