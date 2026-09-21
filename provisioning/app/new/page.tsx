"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
      <main className="container-app py-8">
        <div className="mb-6">
          <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-800">
            ← Order queue
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            New circuit order
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Capture the customer and service details to open a provisioning order.
          </p>
        </div>

        <form onSubmit={submit} className="max-w-3xl">
          <div className="card card-pad space-y-6 p-6">
            <div>
              <div className="section-title">Customer</div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Customer name</label>
                  <input
                    data-testid="new-customer-name-input"
                    value={form.customer_name}
                    onChange={(e) => set("customer_name", e.target.value)}
                    className="input"
                    placeholder="Acme Corporation"
                  />
                </div>
                <div>
                  <label className="label">Account number</label>
                  <input
                    data-testid="new-account-no-input"
                    value={form.account_no}
                    onChange={(e) => set("account_no", e.target.value)}
                    className="input"
                    placeholder="ACC-00000"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <div className="section-title">Service</div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Service type</label>
                  <select
                    data-testid="new-service-type-select"
                    value={form.service_type}
                    onChange={(e) => set("service_type", e.target.value)}
                    className="select"
                  >
                    {SERVICE_TYPES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Bandwidth (Mbps)</label>
                  <select
                    data-testid="new-bandwidth-select"
                    value={form.bandwidth_mbps}
                    onChange={(e) => set("bandwidth_mbps", Number(e.target.value))}
                    className="select"
                  >
                    {BANDWIDTHS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <div className="section-title">Locations</div>
              <div className="space-y-4">
                <div>
                  <label className="label">A-end address</label>
                  <input
                    data-testid="new-a-end-input"
                    value={form.a_end_address}
                    onChange={(e) => set("a_end_address", e.target.value)}
                    className="input"
                    placeholder="Street, City ST"
                  />
                </div>
                <div>
                  <label className="label">Z-end address</label>
                  <input
                    data-testid="new-z-end-input"
                    value={form.z_end_address}
                    onChange={(e) => set("z_end_address", e.target.value)}
                    className="input"
                    placeholder="Street, City ST"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <div className="section-title">Scheduling</div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Priority</label>
                  <select
                    data-testid="new-priority-select"
                    value={form.priority}
                    onChange={(e) => set("priority", e.target.value)}
                    className="select"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">FOC date</label>
                  <input
                    data-testid="new-foc-date-input"
                    type="date"
                    value={form.foc_date}
                    onChange={(e) => set("foc_date", e.target.value)}
                    className="input"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div
                data-testid="new-error"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
              >
                {error}
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              data-testid="new-submit-btn"
              type="submit"
              disabled={busy}
              className="btn btn-primary"
            >
              {busy ? "Creating…" : "Create order"}
            </button>
            <Link href="/" className="btn btn-secondary">
              Cancel
            </Link>
          </div>
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
