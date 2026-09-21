import { pub } from "@/lib/db";
import { ok, fail, handle } from "@/lib/http";

export const dynamic = "force-dynamic";

// Internal endpoint for the /login page. Validates credentials against
// public.users. Role is returned so the page can reject a cross-app login.
export async function POST(req: Request) {
  return handle(async () => {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    const { data, error } = await pub
      .from("users")
      .select("email, full_name, role, password")
      .eq("email", email)
      .maybeSingle();

    if (error) return fail("INTERNAL", error.message, 500);
    if (!data || data.password !== password) {
      return fail("UNAUTHENTICATED", "Invalid email or password", 401);
    }
    return ok({ email: data.email, full_name: data.full_name, role: data.role });
  });
}
