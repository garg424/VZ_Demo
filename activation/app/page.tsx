"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import RequireAuth from "@/components/RequireAuth";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/session";

type Row = {
  order_no: string;
  circuit_id: string;
  customer_name: string;
  service_type: string;
  bandwidth_mbps: number;
  status: string;
  rework_count: number;
  expected_test_count: number;
};

const STATUSES = ["ready_for_activation", "testing", "activated", "closed", "test_failed"];

function Queue() {
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  async function load() {
    setLoading(true);
    const qs = status ? `?status=${status}` : "";
    const res = await api<{ work_orders: Row[] }>(`/api/queue${qs}`);
    setRows(res.data?.work_orders ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function reset() {
    const res = await api("/api/demo/reset", { method: "POST" });
    setToast(res.ok ? "Demo data reset ✓" : `${res.error}: ${res.message}`);
    await load();
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Activation queue</h1>
          <button
            data-testid="reset-btn"
            onClick={reset}
            className="rounded border border-gray-400 bg-white px-4 py-2 text-sm font-semibold"
          >
            Reset demo data
          </button>
        </div>

        {toast && (
          <div data-testid="toast-message" className="mb-4 rounded border bg-white px-4 py-2 text-sm">
            {toast}
          </div>
        )}

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
                <th className="p-2">Circuit</th>
                <th className="p-2">Service</th>
                <th className="p-2">Rework</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
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
                  <td className="p-2 font-mono">{o.circuit_id}</td>
                  <td className="p-2">
                    {o.service_type} · {o.bandwidth_mbps} Mbps
                  </td>
                  <td className="p-2" data-testid={`rework-count-${o.order_no}`}>
                    {o.rework_count}
                  </td>
                  <td className="p-2">
                    <StatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">
                    Nothing in the activation queue yet.
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
