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
      <main className="container-app py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Activation queue
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Work orders handed off from provisioning · {rows.length} item
              {rows.length === 1 ? "" : "s"}
            </p>
          </div>
          <button data-testid="reset-btn" onClick={reset} className="btn btn-secondary">
            Reset demo data
          </button>
        </div>

        {toast && (
          <div
            data-testid="toast-message"
            className="mb-4 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-card"
          >
            {toast}
          </div>
        )}

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
          ) : rows.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-sm font-medium text-slate-600">
                Nothing in the activation queue yet
              </div>
              <div className="mt-1 text-sm text-slate-400">
                Work orders appear here once provisioning hands them off.
              </div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Circuit ID</th>
                  <th>Service</th>
                  <th>Rework</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
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
                    <td className="mono text-slate-500">{o.circuit_id}</td>
                    <td className="capitalize">
                      {o.service_type.replace("_", " ")} · {o.bandwidth_mbps} Mbps
                    </td>
                    <td data-testid={`rework-count-${o.order_no}`}>
                      {o.rework_count > 0 ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                          {o.rework_count}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
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
