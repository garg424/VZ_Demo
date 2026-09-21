# Setup — VZ IntelliQA demo (Provisioning + Activation)

Two Next.js apps over one Supabase Postgres holding three schemas that behave like
three separate systems (`prov`, `act`, `netinv`). Follow these in order.

## 1. Database (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste the entire contents of [`db/schema.sql`](db/schema.sql), and **Run**.
   It creates the schemas, tables, the `act → netinv` trigger, the views, seeds
   two logins and three demo orders, and runs `reset_demo()` once.
3. **Turn RLS off** on all tables. Table editor → each table (`public.users`,
   `public.audit_log`, `prov.orders`, `prov.tasks`, `act.work_orders`, `act.tests`,
   `netinv.circuit_inventory`) → disable Row Level Security. This makes the anon key
   sufficient. (Data becomes publicly writable — use fabricated customer names only.)
4. **Expose the non-public schemas.** Project Settings → API → **Exposed schemas**:
   add `prov`, `act`, `netinv` alongside `public`. Without this the auto-generated
   REST API only serves `public`, and the apps cannot read their own schemas.

> Note: `db/schema.sql` is the initiation-spec SQL plus two small, non-breaking
> additions the apps rely on — `act.work_orders.rework_count` (shown on the
> Activation queue) and `prov.next_ckt()` (draws the circuit number from the
> sequence). Neither changes any scenario assertion.

## 2. Credentials

From **Project Settings → API** copy the Project URL and the `anon` `public` key.

In **each** app folder, copy the example env and fill it in:

```bash
cp provisioning/.env.local.example provisioning/.env.local
cp activation/.env.local.example  activation/.env.local
```

```
SUPABASE_URL=https://YOUR-REF.supabase.co
SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

No `NEXT_PUBLIC_` prefix — the key stays server-side; only route handlers touch the DB.

## 3. Run locally

```bash
cd provisioning && npm install && npm run dev      # http://localhost:3001
```

```bash
cd activation && npm install && npm run dev        # http://localhost:3002
```

Sign in to Provisioning as `prov@demo.io` / `Demo@1234`, to Activation as
`act@demo.io` / `Demo@1234`.

## 4. Smoke test the APIs (no UI)

Provisioning health and an authenticated list:

```bash
curl -s http://localhost:3001/api/health
curl -s http://localhost:3001/api/orders -H "x-demo-user: prov@demo.io"
```

Activation queue (empty until something is handed off) and the scenario-2 endpoint
(a seeded order 404s on Activation until it has been handed off — that's the point):

```bash
curl -s http://localhost:3002/api/queue -H "x-demo-user: act@demo.io"
curl -s http://localhost:3002/api/orders/ORD-1001 -H "x-demo-user: act@demo.io"   # 404 pre-handoff
```

Negative auth checks:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3002/api/orders/ORD-1001            # 401
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3002/api/orders/ORD-1001 \
  -H "x-demo-user: prov@demo.io"                                                               # 403
```

Full lifecycle by curl (drives one order end to end):

```bash
BASE_P=http://localhost:3001
BASE_A=http://localhost:3002
P=(-H "x-demo-user: prov@demo.io" -H "content-type: application/json")
A=(-H "x-demo-user: act@demo.io"  -H "content-type: application/json")

# create -> capture order_no
ORD=$(curl -s "${P[@]}" -X POST $BASE_P/api/orders \
  -d '{"customer_name":"Halcyon Media","account_no":"ACC-70001","service_type":"private_line","bandwidth_mbps":1000,"a_end_address":"1 A St","z_end_address":"2 Z St","priority":"standard","foc_date":"2026-10-15"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['order_no'])")
echo "ORDER: $ORD"

curl -s "${P[@]}" -X POST $BASE_P/api/orders/$ORD/design/start   >/dev/null
curl -s "${P[@]}" -X POST $BASE_P/api/orders/$ORD/design/assign  >/dev/null
for s in 1 2 3 4 5; do curl -s "${P[@]}" -X POST $BASE_P/api/orders/$ORD/tasks/$s/complete >/dev/null; done
curl -s "${P[@]}" -X POST $BASE_P/api/orders/$ORD/configure      >/dev/null
curl -s "${P[@]}" -X POST $BASE_P/api/orders/$ORD/handoff        >/dev/null

curl -s "${A[@]}" -X POST $BASE_A/api/orders/$ORD/pickup         >/dev/null
for s in 1 2 3 4; do curl -s "${A[@]}" -X POST $BASE_A/api/orders/$ORD/tests/$s/result -d '{"result":"pass","measured_value":"ok"}' >/dev/null; done
curl -s "${A[@]}" -X POST $BASE_A/api/orders/$ORD/activate       >/dev/null
curl -s "${A[@]}" -X POST $BASE_A/api/orders/$ORD/close

# verify it reached netinv (scenario 3), over the session pooler:
# psql "<session-pooler-url>" -c "select * from public.v_cross_system_trace where order_no='$ORD'"
```

## 5. Deploy (Vercel)

1. Push this folder to a GitHub repo.
2. Create **two** Vercel projects from the same repo:
   - Project A → Root Directory `provisioning`
   - Project B → Root Directory `activation`
3. In each project add `SUPABASE_URL` and `SUPABASE_ANON_KEY` (Production **and** Preview).
4. Deploy. You get two distinct origins — cross-application testing needs that.
5. Record all URLs, the pooler string, and the anon key in [`docs/endpoints.md`](docs/endpoints.md).

## 6. Run the scenarios

See [`docs/scenarios.md`](docs/scenarios.md) for TC-X1..TC-X4 and the data-driven set
in [`test-data/orders.csv`](test-data/orders.csv). Reset between runs with the
Activation **Reset demo data** button or `POST /api/demo/reset`.
