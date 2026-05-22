/* ============================================================================
   funnel-filters-shared.ts — Types, constants, and parsers for funnel
   filters that are safe to import from BOTH server and client code.

   The query implementations in `lib/queries/funnel.ts` import "server-only"
   (the Supabase client is service-role and must never ship to the browser).
   The filter UI under `components/funnel/funnel-filters.tsx` is a client
   component and needs the SAME types + helpers. Keeping that shared shape
   in its own module prevents the client bundle from accidentally pulling
   in the server-only client through a re-export chain.

   If you add a new filter dimension:
     1. Append to FUNNEL_FILTER_KEYS below.
     2. Mark it as demographic (or not) in FUNNEL_DEMOGRAPHIC_KEYS.
     3. Add a column to the funnel_conversion_detailed SQL view.
     4. Add a pretty label in components/funnel/funnel-filters.tsx.
   ========================================================================== */

export type FunnelFilters = {
  // Inclusive lower bound, exclusive upper bound — YYYY-MM-DD strings.
  from: string;
  to: string;

  // Always-known traffic dimensions (carried on the visitor row).
  utm_source?: string[];
  utm_medium?: string[];
  utm_campaign?: string[];
  landing_page?: string[];
  device_type?: string[];

  // Demographics — only present for visitors who became leads.
  gender?: string[];
  eligibility?: string[];
  bmi_bucket?: string[];
};

export const FUNNEL_FILTER_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "landing_page",
  "device_type",
  "gender",
  "eligibility",
  "bmi_bucket",
] as const;
export type FunnelFilterKey = (typeof FUNNEL_FILTER_KEYS)[number];

export const FUNNEL_DEMOGRAPHIC_KEYS: ReadonlySet<FunnelFilterKey> = new Set([
  "gender",
  "eligibility",
  "bmi_bucket",
]);

export type FunnelFilterOptions = Record<FunnelFilterKey, string[]>;

/* ── defaultFunnelFilters ────────────────────────────────────────────────
   Last 30 days ending tomorrow (so "today" is inclusive in the gte/lt
   pair) — the same window the previous static query used. */
export function defaultFunnelFilters(): FunnelFilters {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const since = new Date(today);
  since.setUTCDate(since.getUTCDate() - 30);
  return {
    from: since.toISOString().slice(0, 10),
    to: tomorrow.toISOString().slice(0, 10),
  };
}

/* ── parseFunnelSearchParams ─────────────────────────────────────────────
   Server pages receive searchParams as a Promise<Record<...>>; once awaited,
   feed the resolved object in here. Each multi-value key is "comma,joined".
   Returns a fully-defaulted FunnelFilters. */
export function parseFunnelSearchParams(
  sp: Record<string, string | string[] | undefined>,
): FunnelFilters {
  const asArray = (v: string | string[] | undefined): string[] | undefined => {
    if (v === undefined) return undefined;
    const arr = Array.isArray(v) ? v : v.split(",");
    const cleaned = arr.map((s) => s.trim()).filter(Boolean);
    return cleaned.length ? cleaned : undefined;
  };

  const defaults = defaultFunnelFilters();
  const fromParam = typeof sp.from === "string" ? sp.from : undefined;
  const toParam = typeof sp.to === "string" ? sp.to : undefined;

  const out: FunnelFilters = {
    from: fromParam ?? defaults.from,
    to: toParam ?? defaults.to,
  };
  for (const k of FUNNEL_FILTER_KEYS) {
    const v = asArray(sp[k]);
    if (v) out[k] = v;
  }
  return out;
}
