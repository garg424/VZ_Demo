const LABELS: Record<string, string> = {
  order_received: "Order received",
  on_hold: "On hold",
  in_design: "In design",
  configured: "Configured",
  handed_off: "Handed off",
  test_failed: "Test failed",
  ready_for_activation: "Ready for activation",
  testing: "Testing",
  activated: "Activated",
  closed: "Closed",
};

const COLORS: Record<string, string> = {
  order_received: "bg-gray-200 text-gray-800",
  on_hold: "bg-amber-200 text-amber-900",
  in_design: "bg-blue-200 text-blue-900",
  configured: "bg-indigo-200 text-indigo-900",
  handed_off: "bg-purple-200 text-purple-900",
  test_failed: "bg-red-200 text-red-900",
  ready_for_activation: "bg-cyan-200 text-cyan-900",
  testing: "bg-blue-200 text-blue-900",
  activated: "bg-green-200 text-green-900",
  closed: "bg-emerald-300 text-emerald-950",
};

// Badge exposes the raw status on data-status; label text is cosmetic.
export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      data-testid="status-badge"
      data-status={status}
      className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
        COLORS[status] ?? "bg-gray-200 text-gray-800"
      }`}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
