import { describe, it, expect } from "vitest";
import { quantize, splitHandsByPitch, inferDifficulty } from "@/lib/engine/midi";

describe("quantize", () => {
  it("snaps to the nearest grid step", () => {
    expect(quantize(0.13, 0.0625)).toBeCloseTo(0.125, 5);
    expect(quantize(0.18, 0.0625)).toBeCloseTo(0.1875, 5);
    expect(quantize(0, 0.0625)).toBe(0);
  });

  it("is a no-op for non-positive steps", () => {
    expect(quantize(0.4, 0)).toBe(0.4);
  });
});

describe("splitHandsByPitch", () => {
  it("puts notes at/above the median in the right hand", () => {
    const hands = splitHandsByPitch([
      { midi: 48 },
      { midi: 50 },
      { midi: 72 },
      { midi: 74 },
    ]);
    expect(hands).toEqual(["L", "L", "R", "R"]);
  });
});

describe("inferDifficulty", () => {
  it("maps note density onto difficulty buckets", () => {
    expect(inferDifficulty(10, 20)).toBe("beginner"); // 0.5 nps
    expect(inferDifficulty(40, 20)).toBe("easy"); // 2 nps
    expect(inferDifficulty(80, 20)).toBe("medium"); // 4 nps
    expect(inferDifficulty(120, 20)).toBe("hard"); // 6 nps -> capped at hard
    expect(inferDifficulty(200, 20)).toBe("hard"); // 10 nps -> capped at hard
  });
});
