"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import RequireAuth from "@/components/RequireAuth";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/session";

type Row = {
  order_no: string;
  customer_name: string;
  service_type: string;
  bandwidth_mbps: number;
  status: string;
  circuit_id: string | null;
  priority: string;
  rework_count: number;
};

const STATUSES = [
  "order_received",
  "on_hold",
  "in_design",
  "configured",
  "handed_off",
  "test_failed",
  "closed",
];

const PRIORITY_STYLES: Record<string, string> = {
  standard: "text-slate-500",
  expedited: "text-amber-600",
  critical: "text-red-600",
};

function Queue() {
  const [orders, setOrders] = useState<Row[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const qs = status ? `?status=${status}` : "";
    const res = await api<{ orders: Row[] }>(`/api/orders${qs}`);
    setOrders(res.data?.orders ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <>
      <Nav />
      <main className="container-app py-8">
        <section className="card a-rise mb-6 border-t-2 border-vz-red">
          <div className="flex flex-wrap items-center gap-4 p-6">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-vz-red text-white">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 4H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
                <rect x="8" y="3" width="8" height="4" rx="1" />
                <path d="M8 12h8M8 16h5" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-vz-red">
                Corvia OSS · Provisioning
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Order queue
              </h1>
              <p className="mt-1 max-w-xl text-sm text-slate-500">
                Design and provision circuit orders — assign circuits, complete tasks,
                and hand off to Activation.
              </p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500 sm:block">
                <span className="font-semibold text-slate-900">{orders.length}</span> in
                queue
              </span>
              <Link data-testid="new-order-btn" href="/new" className="btn btn-primary">
                <span className="text-base leading-none">+</span> New order
              </Link>
            </div>
          </div>
        </section>

        <div className="mb-4 flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Status
          </label>
          <select
            data-testid="status-filter"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="select w-auto"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div data-testid="loading" className="p-10 text-center text-sm text-slate-400">
              Loading…
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-sm font-medium text-slate-600">No orders found</div>
              <div className="mt-1 text-sm text-slate-400">
                Try a different status filter, or create a new order.
              </div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Bandwidth</th>
                  <th>Circuit ID</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, i) => (
                  <tr
                    key={o.order_no}
                    data-testid={`order-row-${o.order_no}`}
                    className="a-row"
                    style={{ ["--i" as string]: i } as React.CSSProperties}
                  >
                    <td>
                      <Link
                        href={`/o/${o.order_no}`}
                        className="mono font-semibold text-vz-red hover:underline"
                      >
                        {o.order_no}
                      </Link>
                    </td>
                    <td className="font-medium text-slate-900">{o.customer_name}</td>
                    <td className="capitalize">{o.service_type.replace("_", " ")}</td>
                    <td>{o.bandwidth_mbps} Mbps</td>
                    <td className="mono text-slate-500">{o.circuit_id ?? "—"}</td>
                    <td className={`capitalize ${PRIORITY_STYLES[o.priority] ?? ""}`}>
                      {o.priority}
                    </td>
                    <td>
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </>
  );
}

export default function Page() {
  return (
    <RequireAuth>
      <Queue />
    </RequireAuth>
  );
}
