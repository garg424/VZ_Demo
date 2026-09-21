"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

  if (loading)
    return (
      <div data-testid="loading" className="grid min-h-screen place-items-center text-sm text-slate-400">
        Loading…
      </div>
    );
  if (!order)
    return <div className="container-app py-10 text-slate-600">Order not found.</div>;

  const allTasksDone = order.tasks.length > 0 && order.tasks.every((t) => t.done);
  const doneCount = order.tasks.filter((t) => t.done).length;

  return (
    <>
      <Nav />
      <main className="container-app py-8">
        <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-800">
          ← Order queue
        </Link>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="mono text-2xl font-bold text-slate-900">{order.order_no}</h1>
          <StatusBadge status={order.status} />
          <span
            data-testid="rework-count"
            className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500"
          >
            rework: {order.rework_count}
          </span>
          <span className="ml-auto text-sm text-slate-500">{order.customer_name}</span>
        </div>

        {toast && (
          <div
            data-testid="toast-message"
            className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-card"
          >
            {toast}
          </div>
        )}

        {order.status === "test_failed" && order.failure_reason && (
          <div
            data-testid="failure-reason-value"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            <span className="font-semibold">Returned from Activation:</span>{" "}
            {order.failure_reason}
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Order facts */}
          <section className="card card-pad p-5">
            <div className="section-title">Order details</div>
            <dl className="kv">
              <dt>Customer</dt>
              <dd data-testid="customer-name-value">{order.customer_name}</dd>
              <dt>Account</dt>
              <dd>{order.account_no}</dd>
              <dt>Service</dt>
              <dd className="capitalize">{order.service_type.replace("_", " ")}</dd>
              <dt>Bandwidth</dt>
              <dd>{order.bandwidth_mbps} Mbps</dd>
              <dt>A-end</dt>
              <dd>{order.a_end_address}</dd>
              <dt>Z-end</dt>
              <dd>{order.z_end_address}</dd>
              <dt>Priority</dt>
              <dd className="capitalize">{order.priority}</dd>
              <dt>FOC date</dt>
              <dd>{order.foc_date}</dd>
              <dt>Field dispatch</dt>
              <dd>{order.needs_field_dispatch ? "Required" : "Not required"}</dd>
            </dl>
          </section>

          {/* Design panel */}
          <section className="card card-pad p-5">
            <div className="section-title">Design &amp; assignment</div>
            <dl className="kv">
              <dt>Circuit ID</dt>
              <dd data-testid="circuit-id-value" className="mono">
                {order.circuit_id ?? "—"}
              </dd>
              <dt>VLAN</dt>
              <dd>{order.vlan_id ?? "—"}</dd>
              <dt>Port</dt>
              <dd className="mono">{order.port_assignment ?? "—"}</dd>
              <dt>CFA</dt>
              <dd className="mono">{order.cfa ?? "—"}</dd>
            </dl>
            {!order.circuit_id && (
              <p className="mt-4 text-xs text-slate-400">
                Circuit ID, VLAN, port and CFA are assigned during design.
              </p>
            )}
          </section>
        </div>

        {/* Task checklist */}
        {order.tasks.length > 0 && (
          <section className="mt-6 card card-pad p-5">
            <div className="flex items-center justify-between">
              <div className="section-title mb-0">Provisioning tasks</div>
              <div className="text-xs font-medium text-slate-400">
                {doneCount}/{order.tasks.length} complete
              </div>
            </div>
            <ul className="mt-3 divide-y divide-slate-100">
              {order.tasks.map((t) => (
                <li
                  key={t.seq}
                  data-testid={`task-row-${t.seq}`}
                  className="flex items-center justify-between py-2.5"
                >
                  <span className="flex items-center gap-3 text-sm">
                    <span
                      className={`grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold ${
                        t.done
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {t.done ? "✓" : t.seq}
                    </span>
                    <span className={t.done ? "text-slate-500 line-through" : "text-slate-800"}>
                      {t.title}
                    </span>
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
                      className="btn btn-secondary btn-sm"
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
        <section className="mt-6 card card-pad p-5">
          <div className="section-title">Actions</div>
          <div className="flex flex-wrap items-center gap-3">
            {order.status === "order_received" && (
              <>
                <button
                  data-testid="start-design-btn"
                  onClick={() =>
                    act(`/api/orders/${orderNo}/design/start`, undefined, "Design started")
                  }
                  className="btn btn-primary"
                >
                  Start design
                </button>
                <span className="mx-1 h-6 w-px bg-slate-200" />
                <input
                  data-testid="hold-reason-input"
                  placeholder="Hold reason"
                  value={holdReason}
                  onChange={(e) => setHoldReason(e.target.value)}
                  className="input w-48"
                />
                <button
                  data-testid="hold-btn"
                  onClick={() =>
                    act(`/api/orders/${orderNo}/hold`, { hold_reason: holdReason }, "On hold")
                  }
                  className="btn btn-warn"
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
                className="btn btn-primary"
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
                className="btn btn-primary"
              >
                Assign circuit
              </button>
            )}

            {order.status === "in_design" && order.circuit_id && (
              <button
                data-testid="configure-btn"
                disabled={!allTasksDone}
                onClick={() => act(`/api/orders/${orderNo}/configure`, undefined, "Configured")}
                className="btn btn-primary"
              >
                Mark configured
              </button>
            )}
            {order.status === "in_design" && order.circuit_id && !allTasksDone && (
              <span className="text-xs text-slate-400">
                Complete all tasks to configure.
              </span>
            )}

            {order.status === "configured" && (
              <button
                data-testid="handoff-btn"
                onClick={() =>
                  act(`/api/orders/${orderNo}/handoff`, undefined, "Handed off to activation")
                }
                className="btn btn-primary"
              >
                Hand off to activation
              </button>
            )}

            {order.status === "test_failed" && (
              <button
                data-testid="rework-btn"
                onClick={() => act(`/api/orders/${orderNo}/rework`, undefined, "Reworked")}
                className="btn btn-primary"
              >
                Rework
              </button>
            )}

            {["handed_off"].includes(order.status) && (
              <span className="text-sm text-slate-500">
                Handed off — now owned by Activation.
              </span>
            )}
            {order.status === "closed" && (
              <span className="text-sm text-slate-500">
                Order closed — circuit in service.
              </span>
            )}
          </div>
        </section>

        {/* Timeline */}
        <section className="mt-6 card card-pad p-5">
          <div className="section-title">Lifecycle timeline</div>
          <ol data-testid="timeline" className="relative ml-1 border-l border-slate-200">
            {events.map((e) => (
              <li key={e.step} className="relative pb-4 pl-5 last:pb-0">
                <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-vz-red" />
                <div className="flex flex-wrap items-center gap-x-2 text-sm">
                  <span className="font-medium text-slate-900">{e.action}</span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium capitalize text-slate-500">
                    {e.system}
                  </span>
                  <span className="text-slate-400">
                    {e.from_status ? `${e.from_status} → ` : ""}
                    {e.to_status}
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-slate-400">{e.actor}</div>
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
