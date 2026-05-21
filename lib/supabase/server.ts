/* ============================================================================
   supabase/server.ts — Server-only Supabase client for the dashboard.

   This module is the ONLY place the service-role key is read. Every page
   imports getSupabase() from here and calls it to get a Supabase client
   that bypasses RLS.

   Why server-only:
     The first line `import "server-only"` makes Next.js fail the build if
     this module is ever imported (directly or transitively) by a Client
     Component. Without it, an accidental import would bundle the service
     role key into the browser JS — a full DB-read credential, leaked.

   Why service role and not anon + RLS:
     v1 dashboard is gated by Vercel Password Protection at the deployment
     layer, so any request that reaches this code has already been
     authenticated. Service role lets the SQL views in
     supabase/migrations/20260521150000_dashboard_funnel_views.sql skip
     RLS entirely, which matches the migration's grant model (no SELECT
     to anon/authenticated). When the dashboard moves to per-user auth,
     swap the service-role key here for an anon key + RLS read policies.

   Why a getter (not a module-level const):
     Avoids reading process.env at module-evaluation time, which doesn't
     play well with Next.js typegen and the eventual switch to
     `connection()` for runtime env reads.
   ========================================================================== */

import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    // Throw loudly in dev so missing env is obvious. Pages catch this and
    // render a "configuration missing" panel instead of a generic 500.
    throw new Error(
      "Supabase env missing. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "SUPABASE_SERVICE_ROLE_KEY in .env.local (and in Vercel project settings).",
    );
  }

  cached = createClient(url, serviceRoleKey, {
    auth: {
      // Server-side client — no session persistence, no auto-refresh.
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cached;
}
