import { act, audit } from "@/lib/db";
import { ok, handle, ApiError } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { getWorkOrder, expectStatus } from "@/lib/workorders";

export const dynamic = "force-dynamic";

// testing -> activated. Blocked until every test passes.
// The DB trigger act.publish_to_inventory() fires on this update and writes
// the row into netinv.circuit_inventory — PROPAGATION POINT 2.
export async function POST(
  req: Request,
  { params }: { params: { orderNo: string } }
) {
  return handle(async () => {
    const user = await requireUser(req, "activation");
    const wo = await getWorkOrder(params.orderNo);
    expectStatus(wo, "testing");

    const { data: tests, error } = await act
      .from("tests")
      .select("seq, result")
      .eq("order_no", wo.order_no);
    if (error) throw new ApiError("INTERNAL", 500, error.message);

    const total = tests?.length ?? 0;
    const passed = (tests ?? []).filter((t) => t.result === "pass").length;
    if (total === 0 || total !== wo.expected_test_count || passed !== total) {
      throw new ApiError(
        "ILLEGAL_TRANSITION",
        409,
        `Cannot activate ${wo.order_no}: ${passed}/${total} tests passed (need all ${wo.expected_test_count})`
      );
    }

    const { data, error: uErr } = await act
      .from("work_orders")
      .update({ status: "activated", activated_at: new Date().toISOString() })
      .eq("order_no", wo.order_no)
      .select("*")
      .single();
    if (uErr) throw new ApiError("INTERNAL", 500, uErr.message);

    await audit(wo.order_no, "activation", "activated", "testing", "activated", user.email);
    return ok(data);
  });
}
