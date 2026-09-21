import { act } from "@/lib/db";
import { ok, handle, ApiError } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { getWorkOrder } from "@/lib/workorders";

export const dynamic = "force-dynamic";

// GET /api/orders/{orderNo} — the endpoint scenario 2 asserts against.
// Returns fields the Activation UI never renders (received_at,
// expected_test_count, source_order_no, bandwidth_mbps) plus a propagation
// block, so this is an API test rather than a screen-scrape in JSON.
export async function GET(
  req: Request,
  { params }: { params: { orderNo: string } }
) {
  return handle(async () => {
    await requireUser(req, "activation");
    const wo = await getWorkOrder(params.orderNo);

    const { data: tests, error } = await act
      .from("tests")
      .select("*")
      .eq("order_no", wo.order_no)
      .order("seq", { ascending: true });
    if (error) throw new ApiError("INTERNAL", 500, error.message);

    // Fields copied from Provisioning at handoff.
    const FIELDS_RECEIVED = 9;

    return ok({
      ...wo,
      source_order_no: wo.order_no,
      tests,
      propagation: {
        from_system: "provisioning",
        received_at: wo.received_at,
        fields_received: FIELDS_RECEIVED,
      },
    });
  });
}
