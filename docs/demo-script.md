# Demo script — VZ IntelliQA (Provisioning → Activation → Inventory)

A ~7-minute live walkthrough that shows one circuit order flowing across three
systems, and how IntelliQA verifies it three different ways (UI, API, DB).
Validated end-to-end against the live deployment on 2026-09-21.

## Links & logins

| | |
|---|---|
| Provisioning | https://vz-demo.vercel.app |
| Activation | https://vz-demo-activation.vercel.app |
| Provisioning login | `prov@demo.io` / `Demo@1234` (Dana Whitaker) |
| Activation login | `act@demo.io` / `Demo@1234` (Marcus Reyes) |

## Before you start (2 min)

1. **Wake the DB** — Supabase free tier sleeps after 7 idle days. Open either app
   and sign in; if the queue loads, the DB is awake.
2. **Reset to a clean seed** — in Activation, click **Reset demo data** (top right),
   or `POST https://vz-demo-activation.vercel.app/api/demo/reset`. Queue should show
   ORD-1001/1002/1003 in Provisioning and an empty Activation queue.
3. **Two browser windows side by side** — left = Provisioning, right = Activation.
   Use separate windows (or one normal + one incognito): login state is per-app, and
   this makes the "different application" point obvious.
4. **One-liner setup:** "Two separate apps, two separate URLs, one shared database
   with three schemas that behave like three independent systems — Provisioning,
   Activation, and a downstream Network Inventory that neither app has a screen for."

---

## Act 1 — Create in Provisioning (90 sec)

*Window: Provisioning.*

1. Sign in as `prov@demo.io`. Land on the **Order queue** (3 seeded orders).
2. Click **New order**. Fill:
   - Customer `Halcyon Media`, Account `ACC-90210`
   - Service type **private_line**, Bandwidth **1000**
   - A-end `500 Congress Ave, Austin TX`, Z-end `1100 Congress Ave, Austin TX`
   - Priority `expedited`, FOC date any future date
   - **Create order** → lands on the detail page as **ORD-1004**, status *Order received*.
3. **Talking point:** "Everything on this screen is what an operator typed. Watch
   which of it the *next* system recreates versus derives."
4. Click **Start design** → status **In design**.
5. Click **Assign circuit** → circuit **DHEC.100234..VZB** is generated, plus VLAN,
   port, CFA, and a **5-item task checklist** appears.
   - **Talking point:** "5 tasks, not 4 — the 5th is 'Schedule field dispatch',
     added automatically because this is a private line. That's data-driven behavior
     IntelliQA can assert on."
6. Click **Complete** on all 5 tasks (top to bottom).
7. Click **Mark configured** (only enabled once every task is done) → status **Configured**.
8. Click **Hand off to activation** → status **Handed off**.
   - **Talking point:** "That handoff just copied the order into a different system.
     Before this click there was no record of it in Activation at all."

## Act 2 — Scenario 1: verify in Activation UI (90 sec)

*Window: Activation.*

1. Sign in as `act@demo.io`. The **Activation queue** now shows **ORD-1004 / Halcyon
   Media / DHEC.100234..VZB / Ready for activation**.
   - **Talking point:** "Same order, a completely different application and URL. It
     appeared only because of the handoff."
2. Open **ORD-1004**. Point at three fields:
   - **Circuit ID `DHEC.100234..VZB`** — identical to what Provisioning generated (copied).
   - **Service profile `PRIVATE_LINE-1000M`** — *derived here*, never typed anywhere.
   - **Expected tests `4`** — *derived* from bandwidth ≥ 1000.
   - **This is Scenario 1:** data created in one app, verified in another; IntelliQA
     checks both the copied value and the transformation.

## Act 3 — Scenario 2: verify via the API (60 sec)

Without touching the Activation UI, show the raw API the way IntelliQA would call it:

```bash
curl -s https://vz-demo-activation.vercel.app/api/orders/ORD-1004 \
  -H "x-demo-user: act@demo.io" | jq
```

Point at fields the **UI never renders**: `source_order_no`, `received_at`, and the
`propagation` block (`from_system`, `fields_received: 9`). Then the negative checks
that are awkward in a UI but trivial here:

```bash
# no auth header -> 401 UNAUTHENTICATED
curl -s -o /dev/null -w "%{http_code}\n" https://vz-demo-activation.vercel.app/api/orders/ORD-1004
# wrong role -> 403 FORBIDDEN_ROLE
curl -s -o /dev/null -w "%{http_code}\n" -H "x-demo-user: prov@demo.io" https://vz-demo-activation.vercel.app/api/orders/ORD-1004
# unknown order -> 404 NOT_FOUND
curl -s -o /dev/null -w "%{http_code}\n" -H "x-demo-user: act@demo.io" https://vz-demo-activation.vercel.app/api/orders/ORD-9999
```

- **Talking point:** "Scenario 2 — same data, verified over HTTP, including auth and
  error paths a screen can't easily show."

## Act 4 — Finish the flow + Scenario 3: verify in the target DB (2 min)

*Window: Activation, ORD-1004.*

1. **Pick up** → status **Testing**, 4 test rows appear.
2. For each test, optionally type a measured value, then click **Pass** (all 4).
3. **Activate** (only enabled once all pass) → status **Activated**.
   - **Talking point:** "Activating just fired a database trigger that published this
     circuit into Network Inventory — a system neither app has a UI for."
4. **Close order** → status **Closed**.
5. Show the system of record directly (DB assertion, the strongest proof):

```bash
# Session pooler (fill DB password + region from Supabase → Connect):
psql "postgresql://postgres.uzgigfqmtgkrfbotvnmv:[DB-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres" \
  -c "select circuit_id, service_profile, inventory_status, billing_start_date
      from netinv.circuit_inventory where order_no='ORD-1004';"
```

Or over REST if you don't have psql handy:

```bash
curl -s 'https://uzgigfqmtgkrfbotvnmv.supabase.co/rest/v1/circuit_inventory?order_no=eq.ORD-1004&select=circuit_id,service_profile,inventory_status,billing_start_date' \
  -H "apikey: <anon-key>" -H "Accept-Profile: netinv" | jq
```

Expect one row: `DHEC.100234..VZB`, `PRIVATE_LINE-1000M`, `in_service`, today's date.

6. The one-query finale — the whole journey across three systems:

```bash
curl -s 'https://uzgigfqmtgkrfbotvnmv.supabase.co/rest/v1/v_cross_system_trace?order_no=eq.ORD-1004&select=prov_status,act_status,inventory_status,reached_activation,reached_inventory' \
  -H "apikey: <anon-key>" | jq
```

Expect **`closed, closed, in_service, true, true`**.

- **Talking point:** "Scenario 3 — created in the apps, verified in a downstream system
  of record that neither app displays. Data genuinely moved; nothing was re-read from
  where it was written."

## Optional Act 5 — the rework loop (2 min)

Shows four app-switches in one case. Reset, create a **1000 Mbps private_line** order
(5 tasks / 4 tests), hand off. In Activation: **Pick up**, **Fail** the Throughput test
with a measured value, **Return to provisioning** with a reason. Show in Provisioning
that the order is **Test failed** with the reason displayed, and `netinv` is still
empty. Click **Rework** → **Hand off** again (rework count now 1). Back in Activation,
pass all tests, **Activate**, **Close**. Now the inventory row exists.

---

## The three scenarios in one line each

| Scenario | Create | Verify | The point |
|---|---|---|---|
| 1 | Provisioning UI | Activation UI | Cross-app: copied value + derived transformation |
| 2 | Provisioning UI | Activation API | Fields/errors the UI never shows |
| 3 | Both UIs | `netinv` DB | A system of record with no UI at all |

## Reset & recovery

- **Reset** between runs: Activation **Reset demo data** button, or
  `POST https://vz-demo-activation.vercel.app/api/demo/reset`, or `select public.reset_demo();`.
- If a screen looks stale, hard-refresh — reads are live (no-store), so a refresh
  always reflects the DB.
- Order numbers restart at ORD-1004 after each reset (seeds are 1001–1003).

## Gotchas

- Don't drive both apps from two people at once against this shared DB — order
  numbers and state will collide. One driver at a time.
- The anon key is server-side only and not in the repo; it lives in Vercel env.
- Free Supabase project pauses after 7 idle days — wake it before the demo.
