/* ============================================================================
   queries/sources.ts — UTM + referrer attribution.

   Reads the traffic_sources view. The view does the LEFT JOIN visitors →
   events(lead_created) → leads(booking_confirmed_at) and exposes the
   conversion rate per first-touch attribution bucket.
   ========================================================================== */

import { getSupabase } from "@/lib/supabase/server";
import { TENANT_ID } from "@/lib/tenant";

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
