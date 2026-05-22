import { describe, it, expect, beforeEach } from "vitest";
import { useGame, LEAD_IN, computeKeyboard } from "@/store/game";
import { twinkle } from "@/lib/songs/twinkle";
import { canon } from "@/lib/songs/canon";
import { buildChart, chartDuration } from "@/lib/engine/chart";
import { shouldFreeze } from "@/lib/engine/practice";
import type { ChartSong } from "@/types/note";

const g = () => useGame.getState();

const handedChart: ChartSong = {
  id: "handed",
  title: "Handed",
  bpm: 60,
  difficulty: "beginner",
  publicDomain: true,
  notes: [
    { midi: 60, start: 0, duration: 0.5, hand: "R" },
    { midi: 48, start: 1, duration: 0.5, hand: "L" },
    { midi: 64, start: 2, duration: 0.5, hand: "R" },
  ],
};

describe("computeKeyboard", () => {
  it("aligns the range to whole octaves around the chart", () => {
    // Twinkle spans C4..A4 -> floor C4 (60), ceil to C5 (72).
    expect(computeKeyboard(twinkle.notes)).toMatchObject({ keyMin: 60, keyMax: 72 });
  });

  it("widens to multiple octaves for wide-range songs", () => {
    // Canon spans D4..F#5 -> C4 (60) .. C6 (84).
    const kb = computeKeyboard(canon.notes);
    expect(kb.keyMin).toBe(60);
    expect(kb.keyMax).toBe(84);
    expect(kb.kbBase).toBeGreaterThanOrEqual(kb.keyMin);
    expect(kb.kbBase).toBeLessThanOrEqual(kb.keyMax - 12);
  });

  it("guarantees at least one octave", () => {
    const kb = computeKeyboard(buildChart(60, [["E4", 1], ["G4", 1]]));
    expect(kb.keyMax - kb.keyMin).toBeGreaterThanOrEqual(12);
  });
});

describe("game store", () => {
  beforeEach(() => {
    g().loadSong(twinkle);
  });

  it("applies LEAD_IN when loading a song", () => {
    expect(g().notes[0].start).toBeCloseTo(twinkle.notes[0].start + LEAD_IN, 5);
    expect(g().noteStates.every((s) => s.status === "pending")).toBe(true);
  });

  it("scores a perfectly timed hit", () => {
    g().start();
    const n0 = g().notes[0];
    g().noteOn(n0.midi, n0.start);
    const s = g();
    expect(s.hits).toBe(1);
    expect(s.score).toBe(100);
    expect(s.streak).toBe(1);
    expect(s.maxStreak).toBe(1);
    expect(s.noteStates[0]).toEqual({ status: "hit", result: "perfect" });
  });

  it("penalizes a wrong note when a hittable note exists", () => {
    g().start();
    const n0 = g().notes[0];
    g().noteOn(n0.midi + 1, n0.start);
    const s = g();
    expect(s.hits).toBe(0);
    expect(s.attempts).toBe(1);
    expect(s.streak).toBe(0);
    expect(s.lastJudge?.result).toBe("miss");
    expect(s.noteStates[0].status).toBe("pending");
  });

  it("auto-misses a note that passes the window unhit", () => {
    g().start();
    const n0 = g().notes[0];
    g().tick(n0.start + 0.3);
    const s = g();
    expect(s.noteStates[0]).toEqual({ status: "missed", result: "miss" });
    expect(s.attempts).toBe(1);
    expect(s.streak).toBe(0);
  });

  it("matches the closest pending note of the same pitch", () => {
    const chart: ChartSong = {
      id: "twonotes",
      title: "Two Notes",
      bpm: 60,
      difficulty: "beginner",
      publicDomain: true,
      notes: [
        { midi: 60, start: 1.0, duration: 0.5 },
        { midi: 60, start: 1.1, duration: 0.5 },
      ],
    };
    g().loadSong(chart);
    g().start();
    const second = g().notes[1];
    // Press slightly before the 2nd note: hittable for both, closest to #1.
    g().noteOn(60, second.start - 0.02);
    const s = g();
    expect(s.noteStates[1].status).toBe("hit");
    expect(s.noteStates[0].status).toBe("pending");
    expect(s.hits).toBe(1);
  });
});

describe("hand filter on load", () => {
  it("filters notes by hand and recomputes duration", () => {
    g().setHandFilter("right");
    g().loadSong(handedChart);
    const notes = g().notes;
    expect(notes).toHaveLength(2);
    expect(notes.every((n) => n.midi !== 48)).toBe(true); // the left-hand note is gone
    expect(g().duration).toBeCloseTo(chartDuration(notes), 5);
    g().setHandFilter("both"); // reset shared store
  });
});

describe("loop wraparound", () => {
  it("re-arms notes inside the loop and leaves others untouched", () => {
    g().setHandFilter("both");
    g().loadSong(twinkle);
    g().start();
    const notes = g().notes;
    // Mark the first three notes hit, then loop-reset a window over note #2 only.
    useGame.setState({
      noteStates: notes.map((_, i) =>
        i < 3 ? { status: "hit" as const, result: "perfect" as const } : { status: "pending" as const },
      ),
    });
    const target = notes[1].start;
    g().loopReset(target - 0.01, target + 0.01);
    const states = g().noteStates;
    expect(states[0].status).toBe("hit");
    expect(states[1].status).toBe("pending");
    expect(states[2].status).toBe("hit");
  });
});

describe("wait gate via store", () => {
  it("freezes at the line and clears once the note is played", () => {
    g().setHandFilter("both");
    g().loadSong(twinkle);
    g().start();
    const n0 = g().notes[0];
    // Time has reached the first note -> should freeze.
    expect(shouldFreeze(g().notes, g().noteStates, n0.start)).toBe(true);
    g().noteOn(n0.midi, n0.start);
    // Now the note is judged, so the gate releases.
    expect(shouldFreeze(g().notes, g().noteStates, n0.start)).toBe(false);
  });
});
