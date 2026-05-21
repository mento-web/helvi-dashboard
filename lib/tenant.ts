/* ============================================================================
   tenant.ts — Single source of truth for "which Helvi instance are we
   showing data for".

   v1 is single-tenant: all queries filter on tenant_id = 'helvi', which is
   also the DEFAULT on every tenant_id column in the database. When the
   dashboard goes multi-tenant, this constant becomes a function of the
   request (headers / session / subdomain) and every query continues to
   work unchanged.

   Centralising it here means future-me can grep ONE call site to find
   every place tenant scoping is applied.
   ========================================================================== */

export const TENANT_ID = "helvi" as const;

export type TenantId = typeof TENANT_ID;
