"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import RequireAuth from "@/components/RequireAuth";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/session";

type Task = {
  id: number;
  seq: number;
  title: string;
  done: boolean;
  done_by: string | null;
};

type Order = {
  order_no: string;
  circuit_id: string | null;
  customer_name: string;
  account_no: string;
  service_type: string;
  bandwidth_mbps: number;
  a_end_address: string;
  z_end_address: string;
  priority: string;
  foc_date: string;
  status: string;
  needs_field_dispatch: boolean;
  vlan_id: number | null;
  port_assignment: string | null;
  cfa: string | null;
  failure_reason: string | null;
  hold_reason: string | null;
  rework_count: number;
  handoff_at: string | null;
  tasks: Task[];
};

type Event = {
  step: number;
  system: string;
  action: string;
  from_status: string | null;
  to_status: string;
  actor: string;
  created_at: string;
};

function Detail({ orderNo }: { orderNo: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [toast, setToast] = useState("");
  const [holdReason, setHoldReason] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const [o, t] = await Promise.all([
      api<Order>(`/api/orders/${orderNo}`),
      api<{ events: Event[] }>(`/api/orders/${orderNo}/timeline`),
    ]);
    if (o.ok) setOrder(o.data!);
    if (t.ok) setEvents(t.data!.events ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNo]);

  async function act(path: string, body?: any, label?: string) {
    const res = await api(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
    setToast(res.ok ? `${label ?? "Done"} ✓` : `${res.error}: ${res.message}`);
    await load();
  }

  if (loading) return <div data-testid="loading" className="p-6">Loading…</div>;
  if (!order) return <div className="p-6">Order not found.</div>;

  const allTasksDone =
    order.tasks.length > 0 && order.tasks.every((t) => t.done);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl p-6">
        <div className="mb-4 flex items-center gap-3">
          <h1 className="font-mono text-xl font-bold">{order.order_no}</h1>
          <StatusBadge status={order.status} />
          <span data-testid="rework-count" className="text-xs text-gray-500">
            rework: {order.rework_count}
          </span>
        </div>

        {toast && (
          <div
            data-testid="toast-message"
            className="mb-4 rounded border border-gray-300 bg-white px-4 py-2 text-sm"
          >
            {toast}
          </div>
        )}

        {order.status === "test_failed" && order.failure_reason && (
          <div
            data-testid="failure-reason-value"
            className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-800"
          >
            Returned from Activation: {order.failure_reason}
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          {/* Order facts */}
          <section className="rounded-lg border bg-white p-4">
            <h2 className="mb-2 font-semibold">Order</h2>
            <dl className="grid grid-cols-2 gap-y-1 text-sm">
              <dt className="text-gray-500">Customer</dt>
              <dd data-testid="customer-name-value">{order.customer_name}</dd>
              <dt className="text-gray-500">Account</dt>
              <dd>{order.account_no}</dd>
              <dt className="text-gray-500">Service</dt>
              <dd>{order.service_type}</dd>
              <dt className="text-gray-500">Bandwidth</dt>
              <dd>{order.bandwidth_mbps} Mbps</dd>
              <dt className="text-gray-500">A-end</dt>
              <dd>{order.a_end_address}</dd>
              <dt className="text-gray-500">Z-end</dt>
              <dd>{order.z_end_address}</dd>
              <dt className="text-gray-500">Priority</dt>
              <dd>{order.priority}</dd>
              <dt className="text-gray-500">FOC date</dt>
              <dd>{order.foc_date}</dd>
              <dt className="text-gray-500">Field dispatch</dt>
              <dd>{order.needs_field_dispatch ? "yes" : "no"}</dd>
            </dl>
          </section>

          {/* Design panel */}
          <section className="rounded-lg border bg-white p-4">
            <h2 className="mb-2 font-semibold">Design</h2>
            <dl className="grid grid-cols-2 gap-y-1 text-sm">
              <dt className="text-gray-500">Circuit ID</dt>
              <dd data-testid="circuit-id-value" className="font-mono">
                {order.circuit_id ?? "—"}
              </dd>
              <dt className="text-gray-500">VLAN</dt>
              <dd>{order.vlan_id ?? "—"}</dd>
              <dt className="text-gray-500">Port</dt>
              <dd>{order.port_assignment ?? "—"}</dd>
              <dt className="text-gray-500">CFA</dt>
              <dd>{order.cfa ?? "—"}</dd>
            </dl>
          </section>
        </div>

        {/* Task checklist */}
        {order.tasks.length > 0 && (
          <section className="mt-6 rounded-lg border bg-white p-4">
            <h2 className="mb-2 font-semibold">Provisioning tasks</h2>
            <ul className="space-y-1 text-sm">
              {order.tasks.map((t) => (
                <li
                  key={t.seq}
                  data-testid={`task-row-${t.seq}`}
                  className="flex items-center justify-between border-b py-1"
                >
                  <span>
                    {t.seq}. {t.title}{" "}
                    {t.done && <span className="text-green-700">✓</span>}
                  </span>
                  {!t.done && order.status === "in_design" && (
                    <button
                      data-testid={`task-row-${t.seq}-complete-btn`}
                      onClick={() =>
                        act(
                          `/api/orders/${orderNo}/tasks/${t.seq}/complete`,
                          undefined,
                          `Task ${t.seq} complete`
                        )
                      }
                      className="rounded bg-gray-800 px-2 py-0.5 text-xs font-semibold text-white"
                    >
                      Complete
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Actions */}
        <section className="mt-6 rounded-lg border bg-white p-4">
          <h2 className="mb-3 font-semibold">Actions</h2>
          <div className="flex flex-wrap items-center gap-3">
            {order.status === "order_received" && (
              <>
                <button
                  data-testid="start-design-btn"
                  onClick={() =>
                    act(`/api/orders/${orderNo}/design/start`, undefined, "Design started")
                  }
                  className="rounded bg-vz-red px-4 py-2 font-semibold text-white"
                >
                  Start design
                </button>
                <input
                  data-testid="hold-reason-input"
                  placeholder="Hold reason"
                  value={holdReason}
                  onChange={(e) => setHoldReason(e.target.value)}
                  className="rounded border px-3 py-2 text-sm"
                />
                <button
                  data-testid="hold-btn"
                  onClick={() =>
                    act(`/api/orders/${orderNo}/hold`, { hold_reason: holdReason }, "On hold")
                  }
                  className="rounded bg-amber-600 px-4 py-2 font-semibold text-white"
                >
                  Place on hold
                </button>
              </>
            )}

            {order.status === "on_hold" && (
              <button
                data-testid="start-design-btn"
                onClick={() =>
                  act(`/api/orders/${orderNo}/design/start`, undefined, "Design started")
                }
                className="rounded bg-vz-red px-4 py-2 font-semibold text-white"
              >
                Resume — start design
              </button>
            )}

            {order.status === "in_design" && !order.circuit_id && (
              <button
                data-testid="assign-circuit-btn"
                onClick={() =>
                  act(`/api/orders/${orderNo}/design/assign`, undefined, "Circuit assigned")
                }
                className="rounded bg-vz-red px-4 py-2 font-semibold text-white"
              >
                Assign circuit
              </button>
            )}

            {order.status === "in_design" && order.circuit_id && (
              <button
                data-testid="configure-btn"
                disabled={!allTasksDone}
                onClick={() =>
                  act(`/api/orders/${orderNo}/configure`, undefined, "Configured")
                }
                className="rounded bg-vz-red px-4 py-2 font-semibold text-white disabled:opacity-50"
              >
                Mark configured
              </button>
            )}

            {order.status === "configured" && (
              <button
                data-testid="handoff-btn"
                onClick={() =>
                  act(`/api/orders/${orderNo}/handoff`, undefined, "Handed off to activation")
                }
                className="rounded bg-vz-red px-4 py-2 font-semibold text-white"
              >
                Hand off to activation
              </button>
            )}

            {order.status === "test_failed" && (
              <button
                data-testid="rework-btn"
                onClick={() =>
                  act(`/api/orders/${orderNo}/rework`, undefined, "Reworked")
                }
                className="rounded bg-vz-red px-4 py-2 font-semibold text-white"
              >
                Rework
              </button>
            )}

            {["handed_off"].includes(order.status) && (
              <span className="text-sm text-gray-500">
                Handed off — now owned by Activation.
              </span>
            )}
          </div>
        </section>

        {/* Timeline */}
        <section className="mt-6 rounded-lg border bg-white p-4">
          <h2 className="mb-2 font-semibold">Lifecycle timeline</h2>
          <ol data-testid="timeline" className="space-y-1 text-sm">
            {events.map((e) => (
              <li key={e.step} className="flex gap-3">
                <span className="w-6 text-gray-400">{e.step}</span>
                <span className="w-24 text-gray-500">{e.system}</span>
                <span className="font-medium">{e.action}</span>
                <span className="text-gray-500">
                  {e.from_status ? `${e.from_status} → ` : ""}
                  {e.to_status}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </>
  );
}

export default function Page({ params }: { params: { orderNo: string } }) {
  return (
    <RequireAuth>
      <Detail orderNo={params.orderNo} />
    </RequireAuth>
  );
}
