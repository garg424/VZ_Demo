import { prov, audit } from "@/lib/db";
import { ok, handle, ApiError } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { getOrder, expectStatus } from "@/lib/orders";

export const dynamic = "force-dynamic";

// in_design -> configured. Blocked until every task is done.
export async function POST(
  req: Request,
  { params }: { params: { orderNo: string } }
) {
  return handle(async () => {
    const user = await requireUser(req, "provisioning");
    const order = await getOrder(params.orderNo);
    expectStatus(order, "in_design");

    const { data: tasks, error } = await prov
      .from("tasks")
      .select("seq, done")
      .eq("order_no", order.order_no);
    if (error) throw new ApiError("INTERNAL", 500, error.message);

    const open = (tasks ?? []).filter((t) => !t.done);
    if ((tasks ?? []).length === 0 || open.length > 0) {
      throw new ApiError(
        "PRECONDITION_FAILED",
        409,
        `Cannot configure ${order.order_no}: ${open.length} provisioning task(s) incomplete`
      );
    }

    const { data, error: uErr } = await prov
      .from("orders")
      .update({ status: "configured" })
      .eq("order_no", order.order_no)
      .select("*")
      .single();
    if (uErr) throw new ApiError("INTERNAL", 500, uErr.message);

    await audit(order.order_no, "provisioning", "configured", order.status, "configured", user.email);
    return ok(data);
  });
}
