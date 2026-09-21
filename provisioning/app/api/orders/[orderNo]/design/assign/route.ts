import { prov, audit } from "@/lib/db";
import { ok, handle, ApiError } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { getOrder, expectStatus } from "@/lib/orders";
import { buildTasks, formatCircuitId } from "@/lib/domain";

export const dynamic = "force-dynamic";

// in_design -> assign circuit_id + design values, create the task checklist.
export async function POST(
  req: Request,
  { params }: { params: { orderNo: string } }
) {
  return handle(async () => {
    const user = await requireUser(req, "provisioning");
    const order = await getOrder(params.orderNo);
    expectStatus(order, "in_design");
    if (order.circuit_id) {
      throw new ApiError(
        "PRECONDITION_FAILED",
        409,
        `Order ${order.order_no} already has circuit ${order.circuit_id}`
      );
    }

    // Draw the next circuit number from the database sequence.
    const { data: seqData, error: seqErr } = await prov.rpc("next_ckt");
    if (seqErr) throw new ApiError("INTERNAL", 500, seqErr.message);
    const circuit_id = formatCircuitId(Number(seqData));

    const vlan_id = 100 + (Number(seqData) % 3900);
    const port_assignment = `GE-0/0/${Number(seqData) % 48}`;
    const cfa = `CFA-${Number(seqData)}`;

    const { data, error } = await prov
      .from("orders")
      .update({ circuit_id, vlan_id, port_assignment, cfa })
      .eq("order_no", order.order_no)
      .select("*")
      .single();
    if (error) throw new ApiError("INTERNAL", 500, error.message);

    // Data-driven task list: 4 or 5 tasks depending on needs_field_dispatch.
    const tasks = buildTasks(order.needs_field_dispatch).map((t) => ({
      ...t,
      order_no: order.order_no,
    }));
    const { error: tErr } = await prov.from("tasks").insert(tasks);
    if (tErr) throw new ApiError("INTERNAL", 500, tErr.message);

    await audit(order.order_no, "provisioning", "circuit_assigned", order.status, order.status, user.email);
    return ok({ ...data, task_count: tasks.length });
  });
}
