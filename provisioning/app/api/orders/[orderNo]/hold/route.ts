import { prov, audit } from "@/lib/db";
import { ok, handle, ApiError } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { getOrder, expectStatus } from "@/lib/orders";

export const dynamic = "force-dynamic";

// order_received -> on_hold, with a reason.
export async function POST(
  req: Request,
  { params }: { params: { orderNo: string } }
) {
  return handle(async () => {
    const user = await requireUser(req, "provisioning");
    const order = await getOrder(params.orderNo);
    expectStatus(order, "order_received");

    const body = await req.json().catch(() => ({}));
    const hold_reason =
      typeof body.hold_reason === "string" ? body.hold_reason.trim() : "";
    if (!hold_reason) {
      throw new ApiError("VALIDATION_FAILED", 400, "hold_reason is required");
    }

    const { data, error } = await prov
      .from("orders")
      .update({ status: "on_hold", hold_reason })
      .eq("order_no", order.order_no)
      .select("*")
      .single();
    if (error) throw new ApiError("INTERNAL", 500, error.message);

    await audit(order.order_no, "provisioning", "hold", order.status, "on_hold", user.email);
    return ok(data);
  });
}
