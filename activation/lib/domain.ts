// Activation tests: 3 base, +1 (latency & jitter SLA) when bandwidth >= 1000.
// The count matches act.work_orders.expected_test_count (a generated column).
export function buildTests(bandwidth_mbps: number) {
  const tests = [
    { test_name: "Loopback", threshold: "< 0.1% frame loss" },
    { test_name: "Bit error rate", threshold: "< 1e-9" },
    { test_name: "Throughput", threshold: `>= ${bandwidth_mbps} Mbps` },
  ];
  if (bandwidth_mbps >= 1000) {
    tests.push({
      test_name: "Latency and jitter SLA",
      threshold: "< 5 ms / < 1 ms",
    });
  }
  return tests.map((t, i) => ({ ...t, seq: i + 1 }));
}

export function expectedTestCount(bandwidth_mbps: number): number {
  return bandwidth_mbps >= 1000 ? 4 : 3;
}
