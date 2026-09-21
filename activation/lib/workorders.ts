import { act } from "./db";
import { ApiError } from "./http";

export type WorkOrder = {
  order_no: string;
  circuit_id: string;
  customer_name: string;
  account_no: string;
  service_type: string;
  bandwidth_mbps: number;
  a_end_address: string;
  z_end_address: string;
  priority: string;
  expected_test_count: number;
  status: string;
  assigned_to: string | null;
  failure_reason: string | null;
  rework_count: number;
  received_at: string;
  activated_at: string | null;
  closed_at: string | null;
};

export async function getWorkOrder(orderNo: string): Promise<WorkOrder> {
  const { data, error } = await act
    .from("work_orders")
    .select("*")
    .eq("order_no", orderNo)
    .maybeSingle();
  if (error) throw new ApiError("INTERNAL", 500, error.message);
  if (!data)
    throw new ApiError("NOT_FOUND", 404, `Work order ${orderNo} not found`);
  return data as WorkOrder;
}

export function expectStatus(wo: WorkOrder, ...allowed: string[]) {
  if (!allowed.includes(wo.status)) {
    throw new ApiError(
      "ILLEGAL_TRANSITION",
      409,
      `Work order ${wo.order_no} is '${wo.status}', expected one of: ${allowed.join(", ")}`
    );
  }
}
