# helvi-dashboard

Internal funnel dashboard for the Helvi Swiss telemedicine landing page
(`mento-web/web-scribe-magic-34`, deployed on Lovable at
`web-scribe-magic-34.lovable.app`). Read-only view onto the existing
Supabase event-sourcing tables — does not write to the database.

Stack: Next.js 16 · React 19 · Tailwind 4 · Recharts · Supabase.

## Pages

| Route             | Shows                                                                |
| ----------------- | -------------------------------------------------------------------- |
| `/`               | KPI strip + 30-day funnel waterfall + 30-day traffic line            |
| `/funnel`         | Per-step "reached" counts + step-to-step drop-off table              |
| `/demographics`   | Gender split (pie) + BMI distribution (histogram) + eligibility bar  |
| `/sources`        | Top 50 first-touch UTM/referrer sources with visitor→booked conv. % |
| `/leads`          | 100 most recent leads with status badges + first-touch source        |

All charts read **SQL views** in the Helvi Supabase project. Views are
created by migration `20260521150000_dashboard_funnel_views.sql` in the
Helvi repo. **Apply that migration before running the dashboard.**

## Local development

```bash
cp .env.local.example .env.local
# Fill in SUPABASE_SERVICE_ROLE_KEY from the Supabase dashboard.

npm install
npm run dev
# Dashboard at http://localhost:3000
```

The dev server uses Turbopack by default (Next.js 16). The first request
to a page is a full SSR pass; refreshes hit the cached Supabase responses.

## Deployment (Vercel)

1. Create a new Vercel project pointing at this repo.
2. In **Project Settings → Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` (same as Helvi's: see `.env.local.example`)
   - `SUPABASE_SERVICE_ROLE_KEY` (from Supabase dashboard → API)
3. In **Project Settings → Deployment Protection**, enable
   **Password Protection** for the Production deployment and share that
   password with stakeholders. This is the v1 access gate.
4. Optionally configure a custom domain
   (`dashboard.helvi.app` or similar).

### Why service-role + Vercel password and not Supabase Auth?

The dashboard is shown to a handful of stakeholders, not the public.
A single shared Vercel password is enough access control for v1 and
saves us from building per-user admin tables, magic-link flows, and
RLS read policies. The `SUPABASE_SERVICE_ROLE_KEY` is read from
`lib/supabase/server.ts` which starts with `import "server-only"` —
Next.js fails the build if a Client Component ever imports it, so the
key cannot leak into the browser bundle.

When the dashboard outgrows that model (more viewers, customer-facing,
multi-tenant), see the plan file for the upgrade path: swap the
service-role key for an anon key + RLS, add a
`dashboard_admins (user_id, tenant_id, role)` table, and gate reads
via `auth.uid()`. The `tenant_id` columns added by the migration
already match that future schema.

## Multi-tenant readiness

Every read filters by `tenant_id`. Today the constant lives in
`lib/tenant.ts` and is `'helvi'`. To support a second tenant, replace
that constant with a function that derives the tenant from the request
(subdomain, header, session). Every query already filters; no other
code changes.

## Data flow

```
Helvi landing (Vite SPA on Lovable)
  src/lib/tracking.ts
    └─ INSERT into public.events, public.visitors, public.leads, public.survey_responses
                            │
                            ▼
                Supabase Postgres
                            │  (read via service role)
                            ▼
helvi-dashboard (this repo, on Vercel)
  Server Components in app/*/page.tsx
    └─ supabase.from('funnel_daily' | 'funnel_conversion' | ...)
```

The dashboard **never writes**. Verify via the browser DevTools
Network panel: only `GET`s should hit `*.supabase.co`.
