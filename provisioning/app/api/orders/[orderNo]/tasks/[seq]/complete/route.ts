import { prov, audit } from "@/lib/db";
import { ok, handle, ApiError } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { getOrder, expectStatus } from "@/lib/orders";

export const dynamic = "force-dynamic";

// Mark one provisioning task complete (keyed by seq, not array index).
export async function POST(
  req: Request,
  { params }: { params: { orderNo: string; seq: string } }
) {
  return handle(async () => {
    const user = await requireUser(req, "provisioning");
    const order = await getOrder(params.orderNo);
    expectStatus(order, "in_design");

    const seq = Number(params.seq);
    const { data: task, error: findErr } = await prov
      .from("tasks")
      .select("*")
      .eq("order_no", order.order_no)
      .eq("seq", seq)
      .maybeSingle();
    if (findErr) throw new ApiError("INTERNAL", 500, findErr.message);
    if (!task)
      throw new ApiError("NOT_FOUND", 404, `Task seq ${seq} not found on ${order.order_no}`);

    const { data, error } = await prov
      .from("tasks")
      .update({ done: true, done_by: user.email, done_at: new Date().toISOString() })
      .eq("id", task.id)
      .select("*")
      .single();
    if (error) throw new ApiError("INTERNAL", 500, error.message);

    await audit(order.order_no, "provisioning", `task_${seq}_done`, order.status, order.status, user.email);
    return ok(data);
  });
}
