import { prov, audit } from "@/lib/db";
import { ok, handle, ApiError } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { getOrder, expectStatus } from "@/lib/orders";

export const dynamic = "force-dynamic";

// test_failed -> configured, incrementing rework_count. Ready to re-hand off.
export async function POST(
  req: Request,
  { params }: { params: { orderNo: string } }
) {
  return handle(async () => {
    const user = await requireUser(req, "provisioning");
    const order = await getOrder(params.orderNo);
    expectStatus(order, "test_failed");

    const { data, error } = await prov
      .from("orders")
      .update({
        status: "configured",
        rework_count: order.rework_count + 1,
        failure_reason: null,
      })
      .eq("order_no", order.order_no)
      .select("*")
      .single();
    if (error) throw new ApiError("INTERNAL", 500, error.message);

    await audit(order.order_no, "provisioning", "rework", "test_failed", "configured", user.email);
    return ok(data);
  });
}
