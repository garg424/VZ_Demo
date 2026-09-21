import { prov, act, audit } from "@/lib/db";
import { ok, handle, ApiError } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { getOrder, expectStatus } from "@/lib/orders";

export const dynamic = "force-dynamic";

// PROPAGATION POINT 1 — handoff.
// Provisioning copies the row into act.work_orders. Before this call there is
// no row in `act` at all, which is what gives scenarios 1 and 2 a clean
// before/after. On a rework re-handoff the existing act row is reset instead.
export async function POST(
  req: Request,
  { params }: { params: { orderNo: string } }
) {
  return handle(async () => {
    const user = await requireUser(req, "provisioning");
    const order = await getOrder(params.orderNo);
    expectStatus(order, "configured");
    if (!order.circuit_id) {
      throw new ApiError(
        "PRECONDITION_FAILED",
        409,
        `Cannot hand off ${order.order_no}: no circuit assigned`
      );
    }

    const now = new Date().toISOString();

    // Is this a first handoff or a rework re-handoff?
    const { data: existing, error: exErr } = await act
      .from("work_orders")
      .select("order_no")
      .eq("order_no", order.order_no)
      .maybeSingle();
    if (exErr) throw new ApiError("INTERNAL", 500, exErr.message);

    const copied = {
      order_no: order.order_no,
      circuit_id: order.circuit_id,
      customer_name: order.customer_name,
      account_no: order.account_no,
      service_type: order.service_type,
      bandwidth_mbps: order.bandwidth_mbps,
      a_end_address: order.a_end_address,
      z_end_address: order.z_end_address,
      priority: order.priority,
      rework_count: order.rework_count,
    };

    if (existing) {
      // Rework: clear the old test run and reset the work order.
      await act.from("tests").delete().eq("order_no", order.order_no);
      const { error } = await act
        .from("work_orders")
        .update({
          ...copied,
          status: "ready_for_activation",
          failure_reason: null,
          assigned_to: null,
          received_at: now,
          activated_at: null,
          closed_at: null,
        })
        .eq("order_no", order.order_no);
      if (error) throw new ApiError("INTERNAL", 500, error.message);
    } else {
      const { error } = await act.from("work_orders").insert({
        ...copied,
        status: "ready_for_activation",
        received_at: now,
      });
      if (error) throw new ApiError("INTERNAL", 500, error.message);
    }

    const { data, error: uErr } = await prov
      .from("orders")
      .update({ status: "handed_off", handoff_at: now })
      .eq("order_no", order.order_no)
      .select("*")
      .single();
    if (uErr) throw new ApiError("INTERNAL", 500, uErr.message);

    await audit(order.order_no, "provisioning", "handed_off", "configured", "handed_off", user.email);
    return ok(data);
  });
}
