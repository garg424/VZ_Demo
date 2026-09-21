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
      <main className="mx-auto max-w-5xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Order queue</h1>
          <Link
            data-testid="new-order-btn"
            href="/new"
            className="rounded bg-vz-red px-4 py-2 font-semibold text-white"
          >
            New order
          </Link>
        </div>

        <div className="mb-4">
          <label className="mr-2 text-sm font-medium">Status</label>
          <select
            data-testid="status-filter"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded border px-3 py-1"
          >
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div data-testid="loading">Loading…</div>
        ) : (
          <table className="w-full border-collapse bg-white text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">Order</th>
                <th className="p-2">Customer</th>
                <th className="p-2">Service</th>
                <th className="p-2">Bandwidth</th>
                <th className="p-2">Circuit</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.order_no}
                  data-testid={`order-row-${o.order_no}`}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="p-2 font-mono">
                    <Link href={`/o/${o.order_no}`} className="text-blue-700 underline">
                      {o.order_no}
                    </Link>
                  </td>
                  <td className="p-2">{o.customer_name}</td>
                  <td className="p-2">{o.service_type}</td>
                  <td className="p-2">{o.bandwidth_mbps} Mbps</td>
                  <td className="p-2 font-mono">{o.circuit_id ?? "—"}</td>
                  <td className="p-2">
                    <StatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">
                    No orders.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
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
