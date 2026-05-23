/* ============================================================================
   queries/sources.ts — UTM + referrer attribution.

   Reads the traffic_sources view. The view does the LEFT JOIN visitors →
   events(lead_created) → leads(booking_confirmed_at) and exposes the
   conversion rate per first-touch attribution bucket.
   ========================================================================== */

import { getSupabase } from "@/lib/supabase/server";
import { TENANT_ID } from "@/lib/tenant";
import type { DashboardDateRange } from "@/lib/date-range";

export type TrafficSourceRow = {
  tenant_id: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  referrer_url: string;
  visitor_count: number;
  lead_count: number;
  booked_count: number;
  visitor_to_booked_pct: number | null;
};

export type TrafficSourceGroupBy =
  | "utm_source"
  | "utm_medium"
  | "utm_campaign"
  | "device_type"
  | "landing_page";

type DetailedAttributionRow = {
  reached_step: number;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  landing_page: string | null;
  device_type: string | null;
};

/* ── getTrafficSources ────────────────────────────────────────────────────
   Returns the full traffic_sources view, ordered by visitor_count desc so
   the highest-traffic sources rise to the top of the Sources page. */
export async function getTrafficSources(limit = 50): Promise<TrafficSourceRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("traffic_sources")
    .select("*")
    .eq("tenant_id", TENANT_ID)
    .order("visitor_count", { ascending: false })
    .limit(limit)
    .returns<TrafficSourceRow[]>();

  if (error) {
    console.error("[sources] getTrafficSources failed:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getTrafficSourcesForRange({
  range,
  groupBy = "utm_source",
  limit = 50,
}: {
  range: DashboardDateRange;
  groupBy?: TrafficSourceGroupBy;
  limit?: number;
}): Promise<TrafficSourceRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("funnel_conversion_detailed")
    .select("reached_step, utm_source, utm_medium, utm_campaign, landing_page, device_type")
    .eq("tenant_id", TENANT_ID)
    .gte("first_event_at", `${range.from}T00:00:00.000Z`)
    .lt("first_event_at", `${range.to}T00:00:00.000Z`)
    .returns<DetailedAttributionRow[]>();

  if (error) {
    console.error("[sources] getTrafficSourcesForRange failed:", error.message);
    return [];
  }

  const buckets = new Map<string, TrafficSourceRow>();

  for (const row of data ?? []) {
    const key = cleanDimension(row[groupBy]);
    const existing = buckets.get(key) ?? {
      tenant_id: TENANT_ID,
      utm_source: groupBy === "utm_source" ? key : "(all)",
      utm_medium: groupBy === "utm_medium" ? key : "(all)",
      utm_campaign: groupBy === "utm_campaign" ? key : "(all)",
      referrer_url: groupBy === "device_type" || groupBy === "landing_page" ? key : "",
      visitor_count: 0,
      lead_count: 0,
      booked_count: 0,
      visitor_to_booked_pct: null,
    };

    existing.visitor_count += 1;
    if (row.reached_step >= 7) existing.lead_count += 1;
    if (row.reached_step >= 9) existing.booked_count += 1;
    buckets.set(key, existing);
  }

  return [...buckets.values()]
    .map((row) => ({
      ...row,
      visitor_to_booked_pct:
        row.visitor_count > 0 ? (row.booked_count / row.visitor_count) * 100 : null,
    }))
    .sort((a, b) => b.visitor_count - a.visitor_count)
    .slice(0, limit);
}

function cleanDimension(value: string | null): string {
  const trimmed = value?.trim();
  return trimmed && trimmed !== "unknown" ? trimmed.toLowerCase() : "(direct)";
}
