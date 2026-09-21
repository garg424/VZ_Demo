import { prov } from "@/lib/db";
import { audit } from "@/lib/db";
import { ok, handle, ApiError } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { validateOrder } from "@/lib/domain";

export const dynamic = "force-dynamic";

// GET /api/orders?status=&service_type=&limit=&offset=
export async function GET(req: Request) {
  return handle(async () => {
    await requireUser(req, "provisioning");
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const service_type = url.searchParams.get("service_type");
    const limit = Math.min(Number(url.searchParams.get("limit")) || 100, 500);
    const offset = Number(url.searchParams.get("offset")) || 0;

    let q = prov
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (status) q = q.eq("status", status);
    if (service_type) q = q.eq("service_type", service_type);

    const { data, error } = await q;
    if (error) throw new ApiError("INTERNAL", 500, error.message);
    return ok({ orders: data, count: data?.length ?? 0 });
  });
}

// POST /api/orders
export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser(req, "provisioning");
    const body = await req.json().catch(() => ({}));
    const v = validateOrder(body);

    const { data, error } = await prov
      .from("orders")
      .insert({ ...v, created_by: user.email })
      .select("*")
      .single();
    if (error) throw new ApiError("INTERNAL", 500, error.message);

    await audit(
      data.order_no,
      "provisioning",
      "created",
      null,
      data.status,
      user.email
    );
    return ok(data, 201);
  });
}
