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

// [pill bg + text, dot color]
const STYLES: Record<string, [string, string]> = {
  order_received: ["bg-slate-100 text-slate-700 ring-slate-200", "bg-slate-400"],
  on_hold: ["bg-amber-50 text-amber-700 ring-amber-200", "bg-amber-500"],
  in_design: ["bg-blue-50 text-blue-700 ring-blue-200", "bg-blue-500"],
  configured: ["bg-indigo-50 text-indigo-700 ring-indigo-200", "bg-indigo-500"],
  handed_off: ["bg-violet-50 text-violet-700 ring-violet-200", "bg-violet-500"],
  test_failed: ["bg-red-50 text-red-700 ring-red-200", "bg-red-500"],
  ready_for_activation: ["bg-cyan-50 text-cyan-700 ring-cyan-200", "bg-cyan-500"],
  testing: ["bg-blue-50 text-blue-700 ring-blue-200", "bg-blue-500"],
  activated: ["bg-emerald-50 text-emerald-700 ring-emerald-200", "bg-emerald-500"],
  closed: ["bg-emerald-600/10 text-emerald-800 ring-emerald-300", "bg-emerald-600"],
};

// Badge exposes the raw status on data-status; label text is cosmetic.
export default function StatusBadge({ status }: { status: string }) {
  const [pill, dot] = STYLES[status] ?? [
    "bg-slate-100 text-slate-700 ring-slate-200",
    "bg-slate-400",
  ];
  return (
    <span
      data-testid="status-badge"
      data-status={status}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {LABELS[status] ?? status}
    </span>
  );
}
