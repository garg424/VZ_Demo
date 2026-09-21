import { prov } from "./db";
import { ApiError } from "./http";

export type Order = {
  order_no: string;
  circuit_id: string | null;
  customer_name: string;
  account_no: string;
  service_type: string;
  bandwidth_mbps: number;
  a_end_address: string;
  z_end_address: string;
  priority: string;
  foc_date: string;
  status: string;
  needs_field_dispatch: boolean;
  vlan_id: number | null;
  port_assignment: string | null;
  cfa: string | null;
  failure_reason: string | null;
  hold_reason: string | null;
  rework_count: number;
  created_by: string | null;
  created_at: string;
  handoff_at: string | null;
};

export async function getOrder(orderNo: string): Promise<Order> {
  const { data, error } = await prov
    .from("orders")
    .select("*")
    .eq("order_no", orderNo)
    .maybeSingle();
  if (error) throw new ApiError("INTERNAL", 500, error.message);
  if (!data) throw new ApiError("NOT_FOUND", 404, `Order ${orderNo} not found`);
  return data as Order;
}

export function expectStatus(order: Order, ...allowed: string[]) {
  if (!allowed.includes(order.status)) {
    throw new ApiError(
      "ILLEGAL_TRANSITION",
      409,
      `Order ${order.order_no} is '${order.status}', expected one of: ${allowed.join(", ")}`
    );
  }
}
