import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_ANON_KEY!;

// One client per schema. Route handlers default to their own app's schema and
// only reach across at a propagation point (handoff, return).
export const prov = createClient(url, key, { db: { schema: "prov" } });
export const act = createClient(url, key, { db: { schema: "act" } });
export const netinv = createClient(url, key, { db: { schema: "netinv" } });
export const pub = createClient(url, key);

export async function audit(
  order_no: string,
  system: "provisioning" | "activation",
  action: string,
  from_status: string | null,
  to_status: string,
  actor: string
) {
  await pub
    .from("audit_log")
    .insert({ order_no, system, action, from_status, to_status, actor });
}
