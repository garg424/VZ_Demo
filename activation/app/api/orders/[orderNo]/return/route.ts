import { act, prov, audit } from "@/lib/db";
import { ok, handle, ApiError } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { getWorkOrder, expectStatus } from "@/lib/workorders";

export const dynamic = "force-dynamic";

// testing -> test_failed, and return the order to Provisioning with a reason.
// This is the return propagation point: Activation writes prov.orders.status.
export async function POST(
  req: Request,
  { params }: { params: { orderNo: string } }
) {
  return handle(async () => {
    const user = await requireUser(req, "activation");
    const wo = await getWorkOrder(params.orderNo);
    expectStatus(wo, "testing");

    const body = await req.json().catch(() => ({}));
    const failure_reason =
      typeof body.failure_reason === "string" ? body.failure_reason.trim() : "";
    if (!failure_reason) {
      throw new ApiError("VALIDATION_FAILED", 400, "failure_reason is required");
    }

    const { data, error } = await act
      .from("work_orders")
      .update({ status: "test_failed", failure_reason })
      .eq("order_no", wo.order_no)
      .select("*")
      .single();
    if (error) throw new ApiError("INTERNAL", 500, error.message);

    // Hand the order back to Provisioning.
    const { error: pErr } = await prov
      .from("orders")
      .update({ status: "test_failed", failure_reason })
      .eq("order_no", wo.order_no);
    if (pErr) throw new ApiError("INTERNAL", 500, pErr.message);

    await audit(wo.order_no, "activation", "returned", "testing", "test_failed", user.email);
    return ok(data);
  });
}
