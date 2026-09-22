"use client";

import { useEffect, useRef, useState } from "react";
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

  // Easter egg: 5 quick clicks on the hero icon unlock the reset control.
  // There is no visible "Reset demo data" button until this is triggered, so
  // casual demo users can't wipe the data mid-demo.
  const [resetUnlocked, setResetUnlocked] = useState(false);
  const tapTimes = useRef<number[]>([]);
  function tapSecret() {
    const now = Date.now();
    // Keep taps within a 3s rolling window; 5 of them unlock reset.
    tapTimes.current = [...tapTimes.current.filter((t) => now - t < 3000), now];
    if (tapTimes.current.length >= 5) {
      tapTimes.current = [];
      setResetUnlocked(true);
      setToast("🔓 Reset unlocked");
    }
  }

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
        <section className="card a-rise mb-6 border-t-2 border-vz-red">
          <div className="flex flex-wrap items-center gap-4 p-6">
            <div
              onClick={tapSecret}
              aria-hidden="true"
              className="grid h-12 w-12 shrink-0 select-none place-items-center rounded-xl bg-vz-red text-white"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4.5 12a7.5 7.5 0 0 1 15 0" />
                <path d="M8 12a4 4 0 0 1 8 0" />
                <path d="M12 12v9" />
                <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-vz-red">
                Corvia OSS · Activation
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Activation queue
              </h1>
              <p className="mt-1 max-w-xl text-sm text-slate-500">
                Pick up handed-off work orders, run acceptance tests, and activate
                circuits into the network.
              </p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500 sm:block">
                <span className="font-semibold text-slate-900">{rows.length}</span> in
                queue
              </span>
              {resetUnlocked && (
                <button data-testid="reset-btn" onClick={reset} className="btn btn-secondary">
                  Reset demo data
                </button>
              )}
            </div>
          </div>
        </section>

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
                {rows.map((o, i) => (
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
