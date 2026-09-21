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
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Order queue
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Provisioning workqueue · {orders.length} order
              {orders.length === 1 ? "" : "s"}
            </p>
          </div>
          <Link data-testid="new-order-btn" href="/new" className="btn btn-primary">
            <span className="text-base leading-none">+</span> New order
          </Link>
        </div>

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
                {orders.map((o) => (
                  <tr key={o.order_no} data-testid={`order-row-${o.order_no}`}>
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
