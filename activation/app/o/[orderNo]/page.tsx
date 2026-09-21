"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import RequireAuth from "@/components/RequireAuth";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/session";

type Test = {
  id: number;
  seq: number;
  test_name: string;
  threshold: string | null;
  result: string;
  measured_value: string | null;
};

type WorkOrder = {
  order_no: string;
  circuit_id: string;
  customer_name: string;
  account_no: string;
  service_type: string;
  bandwidth_mbps: number;
  a_end_address: string;
  z_end_address: string;
  priority: string;
  expected_test_count: number;
  status: string;
  assigned_to: string | null;
  failure_reason: string | null;
  rework_count: number;
  received_at: string;
  activated_at: string | null;
  closed_at: string | null;
  tests: Test[];
};

function Detail({ orderNo }: { orderNo: string }) {
  const [wo, setWo] = useState<WorkOrder | null>(null);
  const [toast, setToast] = useState("");
  const [values, setValues] = useState<Record<number, string>>({});
  const [failReason, setFailReason] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await api<WorkOrder>(`/api/orders/${orderNo}`);
    if (res.ok) setWo(res.data!);
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
  if (!wo) return <div className="p-6">Work order not found.</div>;

  // Derived by Activation — never typed by a tester.
  const serviceProfile = `${wo.service_type.toUpperCase()}-${wo.bandwidth_mbps}M`;
  const allPass =
    wo.tests.length === wo.expected_test_count &&
    wo.tests.length > 0 &&
    wo.tests.every((t) => t.result === "pass");

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl p-6">
        <div className="mb-4 flex items-center gap-3">
          <h1 className="font-mono text-xl font-bold">{wo.order_no}</h1>
          <StatusBadge status={wo.status} />
          <span data-testid="rework-count" className="text-xs text-gray-500">
            rework: {wo.rework_count}
          </span>
        </div>

        {toast && (
          <div data-testid="toast-message" className="mb-4 rounded border bg-white px-4 py-2 text-sm">
            {toast}
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          <section className="rounded-lg border bg-white p-4">
            <h2 className="mb-2 font-semibold">Circuit</h2>
            <dl className="grid grid-cols-2 gap-y-1 text-sm">
              <dt className="text-gray-500">Circuit ID</dt>
              <dd data-testid="circuit-id-value" className="font-mono">
                {wo.circuit_id}
              </dd>
              <dt className="text-gray-500">Service profile</dt>
              <dd data-testid="service-profile-value" className="font-mono">
                {serviceProfile}
              </dd>
              <dt className="text-gray-500">Expected tests</dt>
              <dd data-testid="expected-test-count">{wo.expected_test_count}</dd>
              <dt className="text-gray-500">Customer</dt>
              <dd data-testid="customer-name-value">{wo.customer_name}</dd>
              <dt className="text-gray-500">Account</dt>
              <dd>{wo.account_no}</dd>
              <dt className="text-gray-500">Service</dt>
              <dd>{wo.service_type}</dd>
              <dt className="text-gray-500">Bandwidth</dt>
              <dd>{wo.bandwidth_mbps} Mbps</dd>
              <dt className="text-gray-500">A-end</dt>
              <dd>{wo.a_end_address}</dd>
              <dt className="text-gray-500">Z-end</dt>
              <dd>{wo.z_end_address}</dd>
            </dl>
          </section>

          <section className="rounded-lg border bg-white p-4">
            <h2 className="mb-2 font-semibold">Progress</h2>
            <dl className="grid grid-cols-2 gap-y-1 text-sm">
              <dt className="text-gray-500">Received</dt>
              <dd>{new Date(wo.received_at).toLocaleString()}</dd>
              <dt className="text-gray-500">Assigned to</dt>
              <dd>{wo.assigned_to ?? "—"}</dd>
              <dt className="text-gray-500">Activated</dt>
              <dd>{wo.activated_at ? new Date(wo.activated_at).toLocaleString() : "—"}</dd>
              <dt className="text-gray-500">Closed</dt>
              <dd>{wo.closed_at ? new Date(wo.closed_at).toLocaleString() : "—"}</dd>
            </dl>
            {wo.failure_reason && (
              <div className="mt-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
                Failure: {wo.failure_reason}
              </div>
            )}
          </section>
        </div>

        {/* Test panel */}
        {wo.tests.length > 0 && (
          <section className="mt-6 rounded-lg border bg-white p-4">
            <h2 className="mb-2 font-semibold">Tests</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-2">#</th>
                  <th className="p-2">Test</th>
                  <th className="p-2">Threshold</th>
                  <th className="p-2">Result</th>
                  <th className="p-2">Measured</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {wo.tests.map((t) => (
                  <tr key={t.seq} data-testid={`test-row-${t.seq}`} className="border-b">
                    <td className="p-2">{t.seq}</td>
                    <td className="p-2">{t.test_name}</td>
                    <td className="p-2 text-gray-500">{t.threshold}</td>
                    <td className="p-2">
                      <span data-testid={`test-row-${t.seq}-result`} data-result={t.result}>
                        {t.result}
                      </span>
                    </td>
                    <td className="p-2">
                      {wo.status === "testing" && t.result === "pending" ? (
                        <input
                          data-testid={`test-row-${t.seq}-value-input`}
                          value={values[t.seq] ?? ""}
                          onChange={(e) =>
                            setValues((v) => ({ ...v, [t.seq]: e.target.value }))
                          }
                          placeholder="measured"
                          className="w-28 rounded border px-2 py-0.5"
                        />
                      ) : (
                        t.measured_value ?? "—"
                      )}
                    </td>
                    <td className="p-2">
                      {wo.status === "testing" && t.result === "pending" && (
                        <span className="flex gap-2">
                          <button
                            data-testid={`test-row-${t.seq}-pass-btn`}
                            onClick={() =>
                              act(
                                `/api/orders/${orderNo}/tests/${t.seq}/result`,
                                { result: "pass", measured_value: values[t.seq] ?? "" },
                                `Test ${t.seq} pass`
                              )
                            }
                            className="rounded bg-green-700 px-2 py-0.5 text-xs font-semibold text-white"
                          >
                            Pass
                          </button>
                          <button
                            data-testid={`test-row-${t.seq}-fail-btn`}
                            onClick={() =>
                              act(
                                `/api/orders/${orderNo}/tests/${t.seq}/result`,
                                { result: "fail", measured_value: values[t.seq] ?? "" },
                                `Test ${t.seq} fail`
                              )
                            }
                            className="rounded bg-red-700 px-2 py-0.5 text-xs font-semibold text-white"
                          >
                            Fail
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Actions */}
        <section className="mt-6 rounded-lg border bg-white p-4">
          <h2 className="mb-3 font-semibold">Actions</h2>
          <div className="flex flex-wrap items-center gap-3">
            {wo.status === "ready_for_activation" && (
              <button
                data-testid="pickup-btn"
                onClick={() => act(`/api/orders/${orderNo}/pickup`, undefined, "Picked up")}
                className="rounded bg-vz-red px-4 py-2 font-semibold text-white"
              >
                Pick up
              </button>
            )}

            {wo.status === "testing" && (
              <>
                <button
                  data-testid="activate-btn"
                  disabled={!allPass}
                  onClick={() => act(`/api/orders/${orderNo}/activate`, undefined, "Activated")}
                  className="rounded bg-vz-red px-4 py-2 font-semibold text-white disabled:opacity-50"
                >
                  Activate
                </button>
                <input
                  data-testid="failure-reason-input"
                  placeholder="Return reason"
                  value={failReason}
                  onChange={(e) => setFailReason(e.target.value)}
                  className="rounded border px-3 py-2 text-sm"
                />
                <button
                  data-testid="return-btn"
                  onClick={() =>
                    act(`/api/orders/${orderNo}/return`, { failure_reason: failReason }, "Returned to provisioning")
                  }
                  className="rounded bg-amber-600 px-4 py-2 font-semibold text-white"
                >
                  Return to provisioning
                </button>
              </>
            )}

            {wo.status === "activated" && (
              <button
                data-testid="close-order-btn"
                onClick={() => act(`/api/orders/${orderNo}/close`, undefined, "Closed")}
                className="rounded bg-vz-red px-4 py-2 font-semibold text-white"
              >
                Close order
              </button>
            )}

            {wo.status === "closed" && (
              <span className="text-sm text-gray-500">
                Order closed. Circuit published to network inventory.
              </span>
            )}
            {wo.status === "test_failed" && (
              <span className="text-sm text-gray-500">
                Returned to Provisioning for rework.
              </span>
            )}
          </div>
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
