/* ============================================================================
   queries/funnel.ts — Funnel + traffic-over-time queries.

   Three exports, one per chart the dashboard renders for the acquisition
   funnel:

     getFunnelByStep()    — counts at each canonical funnel step
     getTrafficDaily()    — per-day visitor count for the last N days
     getFunnelConversion()— per-visitor furthest step reached (for cohorts)

   All queries hit the read-only SQL views created by
   supabase/migrations/20260521150000_dashboard_funnel_views.sql in the
   Helvi repo. The views own the SQL; this file is just typed glue.
   ========================================================================== */

import { getSupabase } from "@/lib/supabase/server";
import { TENANT_ID } from "@/lib/tenant";

/* ── Canonical funnel order ──────────────────────────────────────────────
   Mirrors the CASE in funnel_conversion view. If a new event is added to
   the funnel, update the SQL view AND this array in tandem. */
export const FUNNEL_STEPS = [
  { name: "page_viewed",              label: "Visited" },
  { name: "cta_clicked",              label: "Clicked CTA" },
  { name: "bmi_calculated",           label: "Calculated BMI" },
  { name: "survey_started",           label: "Started survey" },
  { name: "survey_question_answered", label: "Answered question" },
  { name: "eligibility_result",       label: "Saw eligibility" },
  { name: "lead_created",             label: "Submitted email" },
  { name: "slot_selected",            label: "Picked slot" },
  { name: "booking_confirmed",        label: "Booked" },
] as const;

export type FunnelStep = (typeof FUNNEL_STEPS)[number]["name"];

/* ── Row shapes returned by the SQL views ─────────────────────────────── */
type FunnelDailyRow = {
  day: string;
  tenant_id: string;
  event_name: string;
  visitor_count: number;
  event_count: number;
};

type FunnelConversionRow = {
  visitor_id: string;
  tenant_id: string;
  reached_step: number;
  first_event_at: string;
  last_event_at: string;
};

/* ── getFunnelByStep ──────────────────────────────────────────────────────
   One row per canonical funnel step with the distinct-visitor count over
   the last `days` days. Used to draw the funnel waterfall on the Overview
   and Funnel pages.

   We aggregate in JS (not SQL) because we want a row for EVERY canonical
   step — even zero-count ones — so the chart axis stays stable. The
   funnel_daily view returns only rows where at least one event fired. */
export async function getFunnelByStep(days = 30): Promise<
  Array<{ step: FunnelStep; label: string; visitors: number }>
> {
  const supabase = getSupabase();
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);

  const { data, error } = await supabase
    .from("funnel_daily")
    .select("event_name, visitor_count, day")
    .eq("tenant_id", TENANT_ID)
    .gte("day", since.toISOString().slice(0, 10))
    .returns<Pick<FunnelDailyRow, "event_name" | "visitor_count" | "day">[]>();

  if (error) {
    console.error("[funnel] getFunnelByStep failed:", error.message);
    return FUNNEL_STEPS.map((s) => ({ step: s.name, label: s.label, visitors: 0 }));
  }

  // Sum per event_name across the window. A visitor counted on two
  // different days is two distinct-per-day visitor counts; we sum them.
  // For unique-visitor-across-window semantics we'd need a different view.
  const totals = new Map<string, number>();
  for (const row of data ?? []) {
    totals.set(row.event_name, (totals.get(row.event_name) ?? 0) + row.visitor_count);
  }

  return FUNNEL_STEPS.map((s) => ({
    step: s.name,
    label: s.label,
    visitors: totals.get(s.name) ?? 0,
  }));
}

/* ── getTrafficDaily ─────────────────────────────────────────────────────
   Time series of distinct-visitor count per day for the page_viewed event,
   ascending by date. Drives the Overview's 30-day traffic line. */
export async function getTrafficDaily(days = 30): Promise<
  Array<{ day: string; visitors: number }>
> {
  const supabase = getSupabase();
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);

  const { data, error } = await supabase
    .from("funnel_daily")
    .select("day, visitor_count")
    .eq("tenant_id", TENANT_ID)
    .eq("event_name", "page_viewed")
    .gte("day", since.toISOString().slice(0, 10))
    .order("day", { ascending: true })
    .returns<Pick<FunnelDailyRow, "day" | "visitor_count">[]>();

  if (error) {
    console.error("[funnel] getTrafficDaily failed:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({ day: row.day, visitors: row.visitor_count }));
}

/* ── getFunnelConversion ─────────────────────────────────────────────────
   Per-visitor furthest step reached, aggregated to a histogram. Used by
   the Funnel page to show the drop-off curve.

   Returns the count of visitors who STOPPED at each step (i.e. step N
   means they reached step N but not step N+1). */
export async function getFunnelConversion(days = 30): Promise<
  Array<{ step: FunnelStep; label: string; reached: number; dropped: number }>
> {
  const supabase = getSupabase();
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);

  const { data, error } = await supabase
    .from("funnel_conversion")
    .select("reached_step, first_event_at")
    .eq("tenant_id", TENANT_ID)
    .gte("first_event_at", since.toISOString())
    .returns<Pick<FunnelConversionRow, "reached_step" | "first_event_at">[]>();

  if (error) {
    console.error("[funnel] getFunnelConversion failed:", error.message);
    return FUNNEL_STEPS.map((s) => ({ step: s.name, label: s.label, reached: 0, dropped: 0 }));
  }

  // Bucket visitors by their reached_step. Then for each canonical step
  // compute reached = count of visitors whose reached_step >= N.
  // dropped = visitors whose reached_step === N (last step they hit).
  const bucketCounts = new Array(FUNNEL_STEPS.length + 1).fill(0);
  for (const row of data ?? []) {
    if (row.reached_step >= 0 && row.reached_step <= FUNNEL_STEPS.length) {
      bucketCounts[row.reached_step] += 1;
    }
  }

  return FUNNEL_STEPS.map((s, idx) => {
    const stepNumber = idx + 1;
    let reached = 0;
    for (let i = stepNumber; i <= FUNNEL_STEPS.length; i++) reached += bucketCounts[i];
    return {
      step: s.name,
      label: s.label,
      reached,
      dropped: bucketCounts[stepNumber],
    };
  });
}
