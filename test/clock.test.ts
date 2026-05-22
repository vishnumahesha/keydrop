import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Clock } from "@/lib/engine/clock";

describe("Clock", () => {
  let now = 0;
  let cbs: Array<(t: number) => void> = [];

  beforeEach(() => {
    now = 0;
    cbs = [];
    vi.stubGlobal("performance", { now: () => now });
    vi.stubGlobal("requestAnimationFrame", (cb: (t: number) => void) => {
      cbs.push(cb);
      return cbs.length;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** Advance wall time by `ms` and flush exactly one frame of callbacks. */
  function frame(ms: number) {
    now += ms;
    const due = cbs;
    cbs = [];
    for (const cb of due) cb(now);
  }

  it("advances songTime by wall delta while running", () => {
    const c = new Clock(() => {});
    c.start();
    expect(c.isRunning).toBe(true);
    frame(16);
    expect(c.songTime).toBeCloseTo(0.016, 5);
    frame(16);
    expect(c.songTime).toBeCloseTo(0.032, 5);
  });

  it("freezes songTime but keeps the loop alive", () => {
    const c = new Clock(() => {});
    c.start();
    frame(16);
    const held = c.songTime;
    c.freeze();
    expect(c.isFrozen).toBe(true);
    frame(16);
    frame(16);
    expect(c.songTime).toBeCloseTo(held, 5);
    c.unfreeze();
    frame(16);
    expect(c.songTime).toBeGreaterThan(held);
  });

  it("scales advance by speed", () => {
    const c = new Clock(() => {});
    c.start();
    c.setSpeed(2);
    frame(10);
    expect(c.songTime).toBeCloseTo(0.02, 5);
  });

  it("never decreases songTime across frames (monotonic)", () => {
    const c = new Clock(() => {});
    c.start();
    let prev = -1;
    for (const step of [16, 8, 33, 16, 16]) {
      frame(step);
      expect(c.songTime).toBeGreaterThanOrEqual(prev);
      prev = c.songTime;
    }
  });

  it("pause halts advance; stop resets to zero", () => {
    const c = new Clock(() => {});
    c.start();
    frame(16);
    const held = c.songTime;
    c.pause();
    expect(c.isRunning).toBe(false);
    frame(16);
    expect(c.songTime).toBeCloseTo(held, 5);
    c.stop();
    expect(c.songTime).toBe(0);
  });

  it("emits ticks with songTime and dt", () => {
    const ticks: Array<{ st: number; dt: number }> = [];
    const c = new Clock((st, dt) => ticks.push({ st, dt }));
    c.start();
    frame(16);
    expect(ticks).toHaveLength(1);
    expect(ticks[0].st).toBeCloseTo(0.016, 5);
    expect(ticks[0].dt).toBeCloseTo(0.016, 5);
  });
});
