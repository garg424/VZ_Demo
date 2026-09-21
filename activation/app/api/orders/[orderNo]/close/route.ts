import { act, audit } from "@/lib/db";
import { ok, handle, ApiError } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { getWorkOrder, expectStatus } from "@/lib/workorders";

export const dynamic = "force-dynamic";

// activated -> closed.
export async function POST(
  req: Request,
  { params }: { params: { orderNo: string } }
) {
  return handle(async () => {
    const user = await requireUser(req, "activation");
    const wo = await getWorkOrder(params.orderNo);
    expectStatus(wo, "activated");

    const { data, error } = await act
      .from("work_orders")
      .update({ status: "closed", closed_at: new Date().toISOString() })
      .eq("order_no", wo.order_no)
      .select("*")
      .single();
    if (error) throw new ApiError("INTERNAL", 500, error.message);

    await audit(wo.order_no, "activation", "closed", "activated", "closed", user.email);
    return ok(data);
  });
}
