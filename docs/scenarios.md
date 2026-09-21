# Test scenarios — VZ IntelliQA demo

One business flow (a circuit order from initiation to closure) with three
independent verification surfaces. Data genuinely moves between stores:
`prov → act` at handoff, `act → netinv` by DB trigger on activation.

## Shared SETUP fixture

Sign in to Provisioning as `prov@demo.io`. Create an order (per the data row).
Capture `order_no`. Start design. Assign circuit. Capture `circuit_id`. Complete
every provisioning task. Mark configured. Hand off to activation.

Key `data-testid`s: `login-email-input`, `login-password-input`, `login-submit-btn`,
`new-service-type-select`, `new-bandwidth-select`, `new-submit-btn`,
`order-row-{orderNo}`, `status-badge` (raw value on `data-status`),
`start-design-btn`, `assign-circuit-btn`, `circuit-id-value`,
`task-row-{seq}-complete-btn`, `configure-btn`, `handoff-btn`, `pickup-btn`,
`test-row-{seq}-pass-btn`, `test-row-{seq}-fail-btn`, `test-row-{seq}-value-input`,
`activate-btn`, `close-order-btn`, `return-btn`, `failure-reason-input`,
`rework-count`, `reset-btn`, `service-profile-value`, `expected-test-count`.

---

## TC-X1 — created in one app, verified in the other (UI → UI)

**Negative first:** before SETUP's handoff, assert the order is **absent** from the
Activation queue (no `order-row-{orderNo}`).

After SETUP, sign out, sign in to Activation as `act@demo.io`. On the queue assert a
row exists for `order_no`. Open it and assert:

- `circuit-id-value` matches exactly the value Provisioning generated
- customer, account, service type, bandwidth, both addresses match what was typed
- `service-profile-value` equals `UPPER(service_type)-{bandwidth}M` — **derived by Activation**
- `expected-test-count` is 4 when bandwidth ≥ 1000, else 3
- `status-badge` `data-status` is `ready_for_activation`

## TC-X2 — created in one app, validated via API (UI → API)

After SETUP, without opening the Activation UI:

```
GET [ACT-BASE]/api/orders/{orderNo}
    x-demo-user: act@demo.io
```

Assert HTTP 200, `ok:true`, and:

- `data.circuit_id`, `data.customer_name`, `data.bandwidth_mbps` match the UI inputs
- `data.expected_test_count` matches the bandwidth rule
- `data.received_at` is not null and later than the order's creation time
- `data.status` is `ready_for_activation`
- `data.propagation.fields_received` and `data.source_order_no` are present (never shown in the UI)

Negative pairs:

- no `x-demo-user` → 401 `UNAUTHENTICATED`
- `x-demo-user: prov@demo.io` → 403 `FORBIDDEN_ROLE`
- `GET /api/orders/ORD-9999` → 404 `NOT_FOUND`
- `POST /api/orders/{orderNo}/activate` while tests pending → 409 `ILLEGAL_TRANSITION`, then assert the DB is unchanged

## TC-X3 — created in source app, validated in target DB (UI → DB)

After SETUP, in Activation: pick up, pass every test, activate, close. Then assert
**only against the database** over the session pooler:

```sql
select circuit_id, order_no, service_profile, bandwidth_mbps,
       inventory_status, billing_start_date, activated_at
from netinv.circuit_inventory
where order_no = :order_no;
```

Assert exactly one row; `circuit_id` equals the Provisioning value; `service_profile`
equals the derived label; `inventory_status` is `in_service`; `billing_start_date` is
today; `activated_at` is not null.

Cross-system trace:

```sql
select prov_status, act_status, inventory_status, reached_activation, reached_inventory
from public.v_cross_system_trace where order_no = :order_no;
```

Expect `closed`, `closed`, `in_service`, `true`, `true`.

**Negative:** for an order **returned** rather than activated, assert
`netinv.circuit_inventory` has **no** row for it.

## TC-X4 — the rework loop (four app switches)

SETUP at 1000 Mbps private line. Assert 5 provisioning tasks and 4 activation tests.
In Activation, fail the throughput test with a measured value and return with a reason.
Assert `prov.orders.status = 'test_failed'` and `netinv` still empty. In Provisioning,
assert the failure reason is displayed, rework, re-hand off, assert `rework_count = 1`.
Back in Activation, pass all tests, activate, close. Assert the inventory row now exists.

## Data-driven set

See [`test-data/orders.csv`](../test-data/orders.csv). The last five columns are
expected **outputs derived by the systems under test**, not inputs echoed back.
Reset between runs (Activation `reset-btn`, `POST /api/demo/reset`, or `select public.reset_demo();`).
