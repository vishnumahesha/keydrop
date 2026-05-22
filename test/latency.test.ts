import { describe, it, expect } from "vitest";
import { computeLatencyOffset, tapError } from "@/lib/engine/latency";

describe("computeLatencyOffset", () => {
  it("returns 0 for no taps", () => {
    expect(computeLatencyOffset([])).toBe(0);
  });

  it("averages consistent offsets", () => {
    expect(computeLatencyOffset([40, 50, 60])).toBe(50);
  });

  it("drops outliers beyond 2 standard deviations", () => {
    // A cluster near 50ms with one wild 500ms mistap.
    const offset = computeLatencyOffset([48, 50, 52, 49, 51, 500]);
    expect(offset).toBeGreaterThanOrEqual(48);
    expect(offset).toBeLessThanOrEqual(52);
  });
});

describe("tapError", () => {
  it("measures signed error against the nearest beat", () => {
    expect(tapError(610, 600)).toBe(10); // 10ms late on beat 1
    expect(tapError(1180, 600)).toBe(-20); // 20ms early on beat 2
    expect(tapError(0, 600)).toBe(0);
  });
});
