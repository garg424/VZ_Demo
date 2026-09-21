import { act, audit } from "@/lib/db";
import { ok, handle, ApiError } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { getWorkOrder, expectStatus } from "@/lib/workorders";
import { buildTests } from "@/lib/domain";

export const dynamic = "force-dynamic";

// ready_for_activation -> testing. Creates the test rows (3 or 4).
export async function POST(
  req: Request,
  { params }: { params: { orderNo: string } }
) {
  return handle(async () => {
    const user = await requireUser(req, "activation");
    const wo = await getWorkOrder(params.orderNo);
    expectStatus(wo, "ready_for_activation");

    const tests = buildTests(wo.bandwidth_mbps).map((t) => ({
      ...t,
      order_no: wo.order_no,
    }));
    const { error: tErr } = await act.from("tests").insert(tests);
    if (tErr) throw new ApiError("INTERNAL", 500, tErr.message);

    const { data, error } = await act
      .from("work_orders")
      .update({ status: "testing", assigned_to: user.email })
      .eq("order_no", wo.order_no)
      .select("*")
      .single();
    if (error) throw new ApiError("INTERNAL", 500, error.message);

    await audit(wo.order_no, "activation", "pickup", "ready_for_activation", "testing", user.email);
    return ok({ ...data, test_count: tests.length });
  });
}
