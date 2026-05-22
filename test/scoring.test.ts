import { describe, it, expect } from "vitest";
import {
  judge,
  isHittable,
  hasPassed,
  computeFinal,
  POINTS,
} from "@/lib/engine/scoring";
import type { NoteEvent } from "@/types/note";

describe("judge", () => {
  it("returns perfect at zero error", () => {
    const j = judge(1, 1);
    expect(j.result).toBe("perfect");
    expect(j.points).toBe(POINTS.perfect);
    expect(j.error).toBe(0);
  });

  it("classifies each window", () => {
    expect(judge(1, 1.04).result).toBe("perfect");
    expect(judge(1, 1.07).result).toBe("great");
    expect(judge(1, 1.09).result).toBe("great");
    expect(judge(1, 1.12).result).toBe("good");
    expect(judge(1, 1.17).result).toBe("good");
    expect(judge(1, 1.2).result).toBe("miss");
  });

  it("is symmetric for early vs late and preserves error sign", () => {
    expect(judge(1, 0.94).result).toBe("great");
    expect(judge(1, 0.94).error).toBeCloseTo(-0.06, 5);
    expect(judge(1, 1.06).error).toBeCloseTo(0.06, 5);
  });

  it("maps points correctly", () => {
    expect(judge(0, 0).points).toBe(100);
    expect(judge(0, 0.08).points).toBe(60);
    expect(judge(0, 0.15).points).toBe(30);
    expect(judge(0, 0.5).points).toBe(0);
  });
});

describe("isHittable / hasPassed", () => {
  const note: NoteEvent = { midi: 60, start: 1, duration: 0.5 };

  it("is hittable within the good window", () => {
    expect(isHittable(1, 1.17)).toBe(true);
    expect(isHittable(1, 0.83)).toBe(true);
    expect(isHittable(1, 1.2)).toBe(false);
  });

  it("passes only beyond the miss window", () => {
    expect(hasPassed(note, 1.25)).toBe(false);
    expect(hasPassed(note, 1.26)).toBe(true);
  });
});

describe("computeFinal", () => {
  it("scores a flawless run at 100", () => {
    const r = computeFinal({
      hits: 10,
      totalNotes: 10,
      timingAvgError: 0,
      holdAccuracy: 1,
      streakBonus: 1,
    });
    expect(r.final).toBeCloseTo(100, 5);
    expect(r.noteHitPct).toBe(1);
    expect(r.timingPct).toBe(1);
  });

  it("weights notes-hit at 50%", () => {
    const r = computeFinal({
      hits: 5,
      totalNotes: 10,
      timingAvgError: 0.18,
      holdAccuracy: 0,
      streakBonus: 0,
    });
    expect(r.timingPct).toBe(0);
    expect(r.final).toBeCloseTo(25, 5);
  });

  it("handles zero notes and clamps over-unity inputs", () => {
    const r = computeFinal({
      hits: 0,
      totalNotes: 0,
      timingAvgError: 999,
      holdAccuracy: 5,
      streakBonus: 5,
    });
    expect(r.noteHitPct).toBe(0);
    expect(r.timingPct).toBe(0);
    expect(r.holdPct).toBe(1);
    expect(r.streakPct).toBe(1);
    expect(r.final).toBeCloseTo(100 * (0.15 + 0.05), 5);
  });
});
