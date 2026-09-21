import { prov } from "@/lib/db";
import { ok, handle, ApiError } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { getOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

// GET /api/orders/{orderNo} — order plus its provisioning tasks.
export async function GET(
  req: Request,
  { params }: { params: { orderNo: string } }
) {
  return handle(async () => {
    await requireUser(req, "provisioning");
    const order = await getOrder(params.orderNo);
    const { data: tasks, error } = await prov
      .from("tasks")
      .select("*")
      .eq("order_no", params.orderNo)
      .order("seq", { ascending: true });
    if (error) throw new ApiError("INTERNAL", 500, error.message);
    return ok({ ...order, tasks });
  });
}
