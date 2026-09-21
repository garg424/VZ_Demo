"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

const RESULT_STYLES: Record<string, string> = {
  pass: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  fail: "bg-red-50 text-red-700 ring-red-200",
  pending: "bg-slate-100 text-slate-500 ring-slate-200",
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

  if (loading)
    return (
      <div data-testid="loading" className="grid min-h-screen place-items-center text-sm text-slate-400">
        Loading…
      </div>
    );
  if (!wo)
    return <div className="container-app py-10 text-slate-600">Work order not found.</div>;

  // Derived by Activation — never typed by a tester.
  const serviceProfile = `${wo.service_type.toUpperCase()}-${wo.bandwidth_mbps}M`;
  const allPass =
    wo.tests.length === wo.expected_test_count &&
    wo.tests.length > 0 &&
    wo.tests.every((t) => t.result === "pass");
  const passCount = wo.tests.filter((t) => t.result === "pass").length;

  return (
    <>
      <Nav />
      <main className="container-app a-fade py-8">
        <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-800">
          ← Activation queue
        </Link>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="mono text-2xl font-bold text-slate-900">{wo.order_no}</h1>
          <StatusBadge status={wo.status} />
          <span
            data-testid="rework-count"
            className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500"
          >
            rework: {wo.rework_count}
          </span>
          <span className="ml-auto text-sm text-slate-500">{wo.customer_name}</span>
        </div>

        {toast && (
          <div
            data-testid="toast-message"
            className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-card"
          >
            {toast}
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Circuit */}
          <section className="card card-pad p-5">
            <div className="section-title">Circuit</div>
            <dl className="kv">
              <dt>Circuit ID</dt>
              <dd data-testid="circuit-id-value" className="mono">
                {wo.circuit_id}
              </dd>
              <dt>Service profile</dt>
              <dd data-testid="service-profile-value" className="mono">
                {serviceProfile}
              </dd>
              <dt>Expected tests</dt>
              <dd data-testid="expected-test-count">{wo.expected_test_count}</dd>
              <dt>Customer</dt>
              <dd data-testid="customer-name-value">{wo.customer_name}</dd>
              <dt>Account</dt>
              <dd>{wo.account_no}</dd>
              <dt>Service</dt>
              <dd className="capitalize">{wo.service_type.replace("_", " ")}</dd>
              <dt>Bandwidth</dt>
              <dd>{wo.bandwidth_mbps} Mbps</dd>
              <dt>A-end</dt>
              <dd>{wo.a_end_address}</dd>
              <dt>Z-end</dt>
              <dd>{wo.z_end_address}</dd>
            </dl>
          </section>

          {/* Progress */}
          <section className="card card-pad p-5">
            <div className="section-title">Progress</div>
            <dl className="kv">
              <dt>Received</dt>
              <dd>{new Date(wo.received_at).toLocaleString()}</dd>
              <dt>Assigned to</dt>
              <dd>{wo.assigned_to ?? "—"}</dd>
              <dt>Activated</dt>
              <dd>{wo.activated_at ? new Date(wo.activated_at).toLocaleString() : "—"}</dd>
              <dt>Closed</dt>
              <dd>{wo.closed_at ? new Date(wo.closed_at).toLocaleString() : "—"}</dd>
            </dl>
            {wo.failure_reason && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                <span className="font-semibold">Failure:</span> {wo.failure_reason}
              </div>
            )}
          </section>
        </div>

        {/* Test panel */}
        {wo.tests.length > 0 && (
          <section className="mt-6 card overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5">
              <div className="section-title mb-0">Acceptance tests</div>
              <div className="text-xs font-medium text-slate-400">
                {passCount}/{wo.expected_test_count} passed
              </div>
            </div>
            <table className="table mt-3">
              <thead>
                <tr>
                  <th className="w-10">#</th>
                  <th>Test</th>
                  <th>Threshold</th>
                  <th>Result</th>
                  <th>Measured</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {wo.tests.map((t) => (
                  <tr key={t.seq} data-testid={`test-row-${t.seq}`}>
                    <td className="text-slate-400">{t.seq}</td>
                    <td className="font-medium text-slate-900">{t.test_name}</td>
                    <td className="mono text-slate-500">{t.threshold}</td>
                    <td>
                      <span
                        data-testid={`test-row-${t.seq}-result`}
                        data-result={t.result}
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${
                          RESULT_STYLES[t.result] ?? RESULT_STYLES.pending
                        }`}
                      >
                        {t.result}
                      </span>
                    </td>
                    <td>
                      {wo.status === "testing" && t.result === "pending" ? (
                        <input
                          data-testid={`test-row-${t.seq}-value-input`}
                          value={values[t.seq] ?? ""}
                          onChange={(e) =>
                            setValues((v) => ({ ...v, [t.seq]: e.target.value }))
                          }
                          placeholder="measured"
                          className="input w-32 py-1 text-xs"
                        />
                      ) : (
                        <span className="mono text-slate-500">{t.measured_value ?? "—"}</span>
                      )}
                    </td>
                    <td className="text-right">
                      {wo.status === "testing" && t.result === "pending" && (
                        <span className="inline-flex gap-2">
                          <button
                            data-testid={`test-row-${t.seq}-pass-btn`}
                            onClick={() =>
                              act(
                                `/api/orders/${orderNo}/tests/${t.seq}/result`,
                                { result: "pass", measured_value: values[t.seq] ?? "" },
                                `Test ${t.seq} pass`
                              )
                            }
                            className="btn btn-success btn-sm"
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
                            className="btn btn-danger btn-sm"
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
        <section className="mt-6 card card-pad p-5">
          <div className="section-title">Actions</div>
          <div className="flex flex-wrap items-center gap-3">
            {wo.status === "ready_for_activation" && (
              <button
                data-testid="pickup-btn"
                onClick={() => act(`/api/orders/${orderNo}/pickup`, undefined, "Picked up")}
                className="btn btn-primary"
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
                  className="btn btn-primary"
                >
                  Activate
                </button>
                {!allPass && (
                  <span className="text-xs text-slate-400">
                    All {wo.expected_test_count} tests must pass to activate.
                  </span>
                )}
                <span className="mx-1 h-6 w-px bg-slate-200" />
                <input
                  data-testid="failure-reason-input"
                  placeholder="Return reason"
                  value={failReason}
                  onChange={(e) => setFailReason(e.target.value)}
                  className="input w-48"
                />
                <button
                  data-testid="return-btn"
                  onClick={() =>
                    act(
                      `/api/orders/${orderNo}/return`,
                      { failure_reason: failReason },
                      "Returned to provisioning"
                    )
                  }
                  className="btn btn-warn"
                >
                  Return to provisioning
                </button>
              </>
            )}

            {wo.status === "activated" && (
              <button
                data-testid="close-order-btn"
                onClick={() => act(`/api/orders/${orderNo}/close`, undefined, "Closed")}
                className="btn btn-primary"
              >
                Close order
              </button>
            )}

            {wo.status === "closed" && (
              <span className="text-sm text-slate-500">
                Order closed. Circuit published to network inventory.
              </span>
            )}
            {wo.status === "test_failed" && (
              <span className="text-sm text-slate-500">
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
