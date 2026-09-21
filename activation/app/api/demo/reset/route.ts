import { pub } from "@/lib/db";
import { ok, fail, handle } from "@/lib/http";

export const dynamic = "force-dynamic";

// POST /api/demo/reset (no auth) — calls public.reset_demo().
export async function POST() {
  return handle(async () => {
    const { error } = await pub.rpc("reset_demo");
    if (error) return fail("INTERNAL", error.message, 500);
    return ok({ reset: true });
  });
}
