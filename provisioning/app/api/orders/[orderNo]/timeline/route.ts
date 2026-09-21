import { pub } from "@/lib/db";
import { ok, handle, ApiError } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { getOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

// GET /api/orders/{orderNo}/timeline — the cross-system audit trail.
export async function GET(
  req: Request,
  { params }: { params: { orderNo: string } }
) {
  return handle(async () => {
    await requireUser(req, "provisioning");
    await getOrder(params.orderNo);
    const { data, error } = await pub
      .from("v_order_lifecycle")
      .select("*")
      .eq("order_no", params.orderNo)
      .order("step", { ascending: true });
    if (error) throw new ApiError("INTERNAL", 500, error.message);
    return ok({ order_no: params.orderNo, events: data });
  });
}
