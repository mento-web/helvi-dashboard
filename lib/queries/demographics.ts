/* ============================================================================
   queries/demographics.ts — Gender, BMI, eligibility breakdowns.

   Reads the demographics_summary view created by the migration. The view
   already buckets leads by gender × eligibility × WHO BMI category, so
   these functions just reshape the result for the chart components.
   ========================================================================== */

import { getSupabase } from "@/lib/supabase/server";
import { TENANT_ID } from "@/lib/tenant";

/* ── WHO BMI categories — keep this in canonical order so the BMI
   histogram x-axis stays stable even when a bucket is empty. */
export const BMI_BUCKETS = [
  { key: "underweight",   label: "Underweight (<18.5)" },
  { key: "normal",        label: "Normal (18.5–24.9)" },
  { key: "overweight",    label: "Overweight (25–29.9)" },
  { key: "obese_class_1", label: "Obese I (30–34.9)" },
  { key: "obese_class_2", label: "Obese II (35–39.9)" },
  { key: "obese_class_3", label: "Obese III (≥40)" },
  { key: "unknown",       label: "Unknown" },
] as const;

export type BmiBucket = (typeof BMI_BUCKETS)[number]["key"];

type DemographicsRow = {
  tenant_id: string;
  gender: "women" | "men";
  eligibility: "eligible" | "borderline" | "low-bmi";
  bmi_bucket: BmiBucket;
  lead_count: number;
  booked_count: number;
  booked_rate_pct: number | null;
};

/* ── getDemographics ──────────────────────────────────────────────────────
   Returns the raw bucket rows. Pages reshape further for individual
   charts (gender pie, BMI histogram, eligibility bar). */
export async function getDemographics(): Promise<DemographicsRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("demographics_summary")
    .select("*")
    .eq("tenant_id", TENANT_ID)
    .returns<DemographicsRow[]>();

  if (error) {
    console.error("[demographics] getDemographics failed:", error.message);
    return [];
  }

  return data ?? [];
}

/* ── getGenderSplit — leads grouped by gender ─────────────────────────────
   Reshape helper for the gender pie chart. */
export function getGenderSplit(rows: DemographicsRow[]): Array<{ gender: string; count: number }> {
  const totals = new Map<string, number>();
  for (const r of rows) {
    totals.set(r.gender, (totals.get(r.gender) ?? 0) + r.lead_count);
  }
  return [...totals.entries()].map(([gender, count]) => ({ gender, count }));
}

/* ── getBmiHistogram — leads grouped by WHO BMI bucket ──────────────────── */
export function getBmiHistogram(
  rows: DemographicsRow[],
): Array<{ bucket: BmiBucket; label: string; count: number }> {
  const totals = new Map<string, number>();
  for (const r of rows) {
    totals.set(r.bmi_bucket, (totals.get(r.bmi_bucket) ?? 0) + r.lead_count);
  }
  return BMI_BUCKETS.map((b) => ({
    bucket: b.key,
    label: b.label,
    count: totals.get(b.key) ?? 0,
  }));
}

/* ── getEligibilitySplit — leads grouped by eligibility outcome ────────── */
export function getEligibilitySplit(
  rows: DemographicsRow[],
): Array<{ eligibility: string; count: number; booked: number }> {
  const buckets = new Map<string, { count: number; booked: number }>();
  for (const r of rows) {
    const cur = buckets.get(r.eligibility) ?? { count: 0, booked: 0 };
    cur.count += r.lead_count;
    cur.booked += r.booked_count;
    buckets.set(r.eligibility, cur);
  }
  // Canonical order. Matches the Helvi survey's eligibility result screens.
  return ["eligible", "borderline", "low-bmi"].map((e) => ({
    eligibility: e,
    count: buckets.get(e)?.count ?? 0,
    booked: buckets.get(e)?.booked ?? 0,
  }));
}
