import { ApiError } from "./http";

export const SERVICE_TYPES = [
  "ethernet",
  "dia",
  "mpls",
  "private_line",
] as const;
export const BANDWIDTHS = [10, 100, 500, 1000, 10000] as const;
export const PRIORITIES = ["standard", "expedited", "critical"] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];

export function needsFieldDispatch(
  service_type: string,
  bandwidth_mbps: number
): boolean {
  return (
    service_type === "private_line" ||
    service_type === "mpls" ||
    bandwidth_mbps >= 1000
  );
}

// Provisioning design tasks: 4 base, +1 when a field dispatch is required.
export function buildTasks(needsDispatch: boolean) {
  const titles = [
    "Validate service address",
    "Assign circuit ID and port",
    "Build configuration",
    "Issue design layout record",
  ];
  if (needsDispatch) titles.push("Schedule field dispatch");
  return titles.map((title, i) => ({ title, seq: i + 1 }));
}

// Circuit ID format: DHEC.<n>..VZB  (confirm the literal with the client partner).
export function formatCircuitId(n: number): string {
  return `DHEC.${n}..VZB`;
}

type OrderInput = {
  customer_name?: unknown;
  account_no?: unknown;
  service_type?: unknown;
  bandwidth_mbps?: unknown;
  a_end_address?: unknown;
  z_end_address?: unknown;
  priority?: unknown;
  foc_date?: unknown;
};

export type ValidOrder = {
  customer_name: string;
  account_no: string;
  service_type: ServiceType;
  bandwidth_mbps: number;
  a_end_address: string;
  z_end_address: string;
  priority: string;
  foc_date: string;
};

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export function validateOrder(body: OrderInput): ValidOrder {
  const errors: string[] = [];

  const customer_name = str(body.customer_name);
  const account_no = str(body.account_no);
  const service_type = str(body.service_type);
  const a_end_address = str(body.a_end_address);
  const z_end_address = str(body.z_end_address);
  const priority = str(body.priority) || "standard";
  const foc_date = str(body.foc_date);
  const bandwidth_mbps = Number(body.bandwidth_mbps);

  if (!customer_name) errors.push("customer_name is required");
  if (!account_no) errors.push("account_no is required");
  if (!SERVICE_TYPES.includes(service_type as ServiceType))
    errors.push(`service_type must be one of ${SERVICE_TYPES.join(", ")}`);
  if (!BANDWIDTHS.includes(bandwidth_mbps as (typeof BANDWIDTHS)[number]))
    errors.push(`bandwidth_mbps must be one of ${BANDWIDTHS.join(", ")}`);
  if (!a_end_address) errors.push("a_end_address is required");
  if (!z_end_address) errors.push("z_end_address is required");
  if (!PRIORITIES.includes(priority as (typeof PRIORITIES)[number]))
    errors.push(`priority must be one of ${PRIORITIES.join(", ")}`);
  if (!foc_date || Number.isNaN(Date.parse(foc_date)))
    errors.push("foc_date is required (YYYY-MM-DD)");

  if (errors.length) {
    throw new ApiError("VALIDATION_FAILED", 400, errors.join("; "));
  }

  return {
    customer_name,
    account_no,
    service_type: service_type as ServiceType,
    bandwidth_mbps,
    a_end_address,
    z_end_address,
    priority,
    foc_date,
  };
}
