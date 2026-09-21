import { prov, audit } from "@/lib/db";
import { ok, handle, ApiError } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { getOrder, expectStatus } from "@/lib/orders";

export const dynamic = "force-dynamic";

// order_received -> in_design
export async function POST(
  req: Request,
  { params }: { params: { orderNo: string } }
) {
  return handle(async () => {
    const user = await requireUser(req, "provisioning");
    const order = await getOrder(params.orderNo);
    expectStatus(order, "order_received", "on_hold");

    const { data, error } = await prov
      .from("orders")
      .update({ status: "in_design", hold_reason: null })
      .eq("order_no", order.order_no)
      .select("*")
      .single();
    if (error) throw new ApiError("INTERNAL", 500, error.message);

    await audit(order.order_no, "provisioning", "design_started", order.status, "in_design", user.email);
    return ok(data);
  });
}
