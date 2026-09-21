import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_ANON_KEY!;

// Next.js patches global fetch and caches results by default. supabase-js uses
// fetch internally, so without this every read could return a stale response
// (even with `dynamic = 'force-dynamic'` on the route). Force no-store on all
// Supabase HTTP calls so the apps always read live data.
const noStoreFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: "no-store" });
const opts = { global: { fetch: noStoreFetch } };

// One client per schema. Route handlers default to their own app's schema and
// only reach across at a propagation point (handoff, return).
export const prov = createClient(url, key, { ...opts, db: { schema: "prov" } });
export const act = createClient(url, key, { ...opts, db: { schema: "act" } });
export const netinv = createClient(url, key, { ...opts, db: { schema: "netinv" } });
export const pub = createClient(url, key, opts);

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
