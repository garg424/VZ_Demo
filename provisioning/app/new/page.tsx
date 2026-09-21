"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/session";

const SERVICE_TYPES = ["ethernet", "dia", "mpls", "private_line"];
const BANDWIDTHS = [10, 100, 500, 1000, 10000];
const PRIORITIES = ["standard", "expedited", "critical"];

function NewOrder() {
  const router = useRouter();
  const [form, setForm] = useState({
    customer_name: "",
    account_no: "",
    service_type: "ethernet",
    bandwidth_mbps: 100,
    a_end_address: "",
    z_end_address: "",
    priority: "standard",
    foc_date: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await api<{ order_no: string }>("/api/orders", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.message || "Could not create order");
      return;
    }
    router.push(`/o/${res.data!.order_no}`);
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-2xl p-6">
        <h1 className="mb-4 text-xl font-bold">New order</h1>
        <form onSubmit={submit} className="space-y-4 rounded-lg border bg-white p-6">
          <div>
            <label className="block text-sm font-medium">Customer name</label>
            <input
              data-testid="new-customer-name-input"
              value={form.customer_name}
              onChange={(e) => set("customer_name", e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Account number</label>
            <input
              data-testid="new-account-no-input"
              value={form.account_no}
              onChange={(e) => set("account_no", e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Service type</label>
              <select
                data-testid="new-service-type-select"
                value={form.service_type}
                onChange={(e) => set("service_type", e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
              >
                {SERVICE_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Bandwidth (Mbps)</label>
              <select
                data-testid="new-bandwidth-select"
                value={form.bandwidth_mbps}
                onChange={(e) => set("bandwidth_mbps", Number(e.target.value))}
                className="mt-1 w-full rounded border px-3 py-2"
              >
                {BANDWIDTHS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">A-end address</label>
            <input
              data-testid="new-a-end-input"
              value={form.a_end_address}
              onChange={(e) => set("a_end_address", e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Z-end address</label>
            <input
              data-testid="new-z-end-input"
              value={form.z_end_address}
              onChange={(e) => set("z_end_address", e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Priority</label>
              <select
                data-testid="new-priority-select"
                value={form.priority}
                onChange={(e) => set("priority", e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">FOC date</label>
              <input
                data-testid="new-foc-date-input"
                type="date"
                value={form.foc_date}
                onChange={(e) => set("foc_date", e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
              />
            </div>
          </div>

          {error && (
            <div data-testid="new-error" className="text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          <button
            data-testid="new-submit-btn"
            type="submit"
            disabled={busy}
            className="rounded bg-vz-red px-5 py-2 font-semibold text-white disabled:opacity-60"
          >
            Create order
          </button>
        </form>
      </main>
    </>
  );
}

export default function Page() {
  return (
    <RequireAuth>
      <NewOrder />
    </RequireAuth>
  );
}
