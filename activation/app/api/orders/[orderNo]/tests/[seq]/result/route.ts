import { act, audit } from "@/lib/db";
import { ok, handle, ApiError } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { getWorkOrder, expectStatus } from "@/lib/workorders";

export const dynamic = "force-dynamic";

// Record one test result: { result: 'pass' | 'fail', measured_value }.
export async function POST(
  req: Request,
  { params }: { params: { orderNo: string; seq: string } }
) {
  return handle(async () => {
    const user = await requireUser(req, "activation");
    const wo = await getWorkOrder(params.orderNo);
    expectStatus(wo, "testing");

    const body = await req.json().catch(() => ({}));
    const result = typeof body.result === "string" ? body.result : "";
    const measured_value =
      typeof body.measured_value === "string" ? body.measured_value : null;
    if (!["pass", "fail"].includes(result)) {
      throw new ApiError("VALIDATION_FAILED", 400, "result must be 'pass' or 'fail'");
    }

    const seq = Number(params.seq);
    const { data: test, error: findErr } = await act
      .from("tests")
      .select("*")
      .eq("order_no", wo.order_no)
      .eq("seq", seq)
      .maybeSingle();
    if (findErr) throw new ApiError("INTERNAL", 500, findErr.message);
    if (!test)
      throw new ApiError("NOT_FOUND", 404, `Test seq ${seq} not found on ${wo.order_no}`);

    const { data, error } = await act
      .from("tests")
      .update({
        result,
        measured_value,
        run_by: user.email,
        run_at: new Date().toISOString(),
      })
      .eq("id", test.id)
      .select("*")
      .single();
    if (error) throw new ApiError("INTERNAL", 500, error.message);

    await audit(wo.order_no, "activation", `test_${seq}_${result}`, "testing", "testing", user.email);
    return ok(data);
  });
}
