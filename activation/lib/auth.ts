import { pub } from "./db";
import { ApiError } from "./http";

export type DemoUser = {
  email: string;
  full_name: string;
  role: string;
};

// API auth: the actor's email travels in the x-demo-user header. No tokens.
// Missing header or unknown user -> 401. Wrong role -> 403.
export async function requireUser(
  req: Request,
  requiredRole: "provisioning" | "activation"
): Promise<DemoUser> {
  const email = req.headers.get("x-demo-user");
  if (!email) {
    throw new ApiError(
      "UNAUTHENTICATED",
      401,
      "Missing x-demo-user header"
    );
  }
  const { data, error } = await pub
    .from("users")
    .select("email, full_name, role")
    .eq("email", email)
    .maybeSingle();

  if (error) throw new ApiError("INTERNAL", 500, error.message);
  if (!data) {
    throw new ApiError(
      "UNAUTHENTICATED",
      401,
      `Unknown user: ${email}`
    );
  }
  if (data.role !== requiredRole) {
    throw new ApiError(
      "FORBIDDEN_ROLE",
      403,
      `User ${email} has role '${data.role}', requires '${requiredRole}'`
    );
  }
  return data as DemoUser;
}
