# Public access surfaces — VZ IntelliQA demo

Fill in the bracketed values after creating the Supabase project and deploying to Vercel.

## App URLs

| App | Local | Deployed |
|---|---|---|
| Provisioning | http://localhost:3001 | https://vz-demo.vercel.app |
| Activation | http://localhost:3002 | https://vz-demo-activation.vercel.app |

## OpenAPI specs

| App | URL |
|---|---|
| Provisioning | https://vz-demo.vercel.app/api/openapi.json |
| Activation | https://vz-demo-activation.vercel.app/api/openapi.json |

## Logins (seeded in public.users)

| Role | Email | Password | Name |
|---|---|---|---|
| provisioning | `prov@demo.io` | `Demo@1234` | Dana Whitaker |
| activation | `act@demo.io` | `Demo@1234` | Marcus Reyes |

## Postgres — for database assertions (scenario 3)

Use the **session pooler** string (port 5432), not the direct connection.
Supabase Dashboard → Connect → Session pooler (project ref `uzgigfqmtgkrfbotvnmv`;
fill in your DB password and the region shown in the dashboard):

```
postgresql://postgres.uzgigfqmtgkrfbotvnmv:[DB-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

Session mode (5432) supports prepared statements. Avoid transaction mode (6543) for testing.

Smoke test from outside:

```bash
psql "postgresql://postgres.uzgigfqmtgkrfbotvnmv:[DB-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres" \
  -c "select * from public.v_cross_system_trace"
```

## Supabase REST — same assertions over HTTP

Base URL: `https://uzgigfqmtgkrfbotvnmv.supabase.co/rest/v1/`
Anon key: **not committed** — this repo is public and RLS is off, so the anon key
grants full DB access. Get it from Supabase → Project Settings → API (anon public),
or from either app's local `.env.local` (`SUPABASE_ANON_KEY`).

Non-public schemas need a profile header:

```
GET https://uzgigfqmtgkrfbotvnmv.supabase.co/rest/v1/circuit_inventory?order_no=eq.ORD-1004
    apikey: <anon-key>
    Accept-Profile: netinv
```

For scenario 3, prefer the Postgres connection — a real SQL assertion against a separate schema is the stronger demonstration.

## API auth model

- REST API auth is the header `x-demo-user: <email>`. No tokens.
- Missing header → 401 `UNAUTHENTICATED`. Wrong role → 403 `FORBIDDEN_ROLE`.
- `GET /api/health` and `POST /api/demo/reset` need no auth.

## Reset between runs

- Activation UI → **Reset demo data** button, or
- `POST [ACT-BASE]/api/demo/reset`, or
- `select public.reset_demo();` over the pooler.

## Operational notes

- Free Supabase projects pause after 7 days idle — hit the project the morning of the demo.
- Free tier keeps no backups; `reset_demo()` is your recovery.
- A free organisation is capped at 2 active projects.
- RLS is **off** on all tables (anon key is sufficient). Data is publicly writable — use fabricated customer names only.
