import { act } from "@/lib/db";
import { ok, handle, ApiError } from "@/lib/http";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/queue?status= — reads act.work_orders only.
export async function GET(req: Request) {
  return handle(async () => {
    await requireUser(req, "activation");
    const url = new URL(req.url);
    const status = url.searchParams.get("status");

    let q = act
      .from("work_orders")
      .select("*")
      .order("received_at", { ascending: false });
    if (status) q = q.eq("status", status);

    const { data, error } = await q;
    if (error) throw new ApiError("INTERNAL", 500, error.message);
    return ok({ work_orders: data, count: data?.length ?? 0 });
  });
}
