# VZ IntelliQA Demo — Circuit Provisioning + Activation

Two small Next.js apps over one Supabase Postgres holding **three schemas that
behave like three separate systems**. Models a circuit order from initiation to
closure and gives one business flow three independent verification surfaces for an
agentic-testing (IntelliQA) demo.

| # | Scenario | Create in | Verify in | Verified surface |
|---|---|---|---|---|
| 1 | Cross-app UI | Provisioning UI | Activation UI | Different application, different rendering |
| 2 | UI create, API verify | Provisioning UI | Activation REST API | HTTP payload, fields the UI never shows |
| 3 | UI create, target DB verify | Provisioning + Activation UI | `netinv` schema | A system of record neither app's UI displays |

**The honest bit:** data genuinely moves between stores. Provisioning owns `prov`,
Activation owns `act`, network inventory is `netinv`. Handoff copies `prov → act`.
Activation publishes `act → netinv` via a **database trigger** — the row lands in the
target system without either application writing it.

```
prov (Provisioning)                    act (Activation)              netinv (Inventory)
order_received → in_design → configured
   → handed_off ==[handoff copies row]==> ready_for_activation
                                            → testing → activated ==[trigger]==> circuit_inventory
                                            → closed
   <=[return, with reason]===============  test_failed
   → rework → handed_off ==============> ready_for_activation (rework_count+1)
```

## Layout

```
VZ Demo Apps/
├─ db/schema.sql            # run once in Supabase
├─ provisioning/            # Next.js app → Vercel root "provisioning" (port 3001)
├─ activation/              # Next.js app → Vercel root "activation"   (port 3002)
├─ test-data/orders.csv     # data-driven set
├─ docs/endpoints.md        # all URLs, pooler string, logins
├─ docs/scenarios.md        # TC-X1..TC-X4
└─ SETUP.md                 # start here
```

## Quick start

See [SETUP.md](SETUP.md). In short: run `db/schema.sql` in Supabase, turn RLS off,
expose the `prov`/`act`/`netinv` schemas, fill each app's `.env.local`, then
`npm install && npm run dev` in each app.

## Apps

- **Provisioning** (4 pages): `/login`, `/` order queue, `/new` order form, `/o/[orderNo]` detail.
- **Activation** (3 pages): `/login`, `/` queue with Reset, `/o/[orderNo]` detail.

The browser never talks to Supabase directly — pages call their own app's API, and
only route handlers touch the database. That is what lets a UI test and an API test
exercise identical logic.

Logins: `prov@demo.io` / `act@demo.io`, password `Demo@1234`.

## Scope

No real network elements, customer portal, billing beyond the inventory row, SLA
timers, dashboards, file attachments, or user management — two seeded logins only.
Demo data is fabricated; tables are publicly writable with RLS off.
