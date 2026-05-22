import { describe, it, expect } from "vitest";
import {
  weakSections,
  filterByHand,
  shouldFreeze,
  resetStatesInRange,
  nextPendingIndex,
  isMonophonic,
} from "@/lib/engine/practice";
import type { NoteEvent, NoteStatus } from "@/types/note";

const note = (start: number, hand?: "L" | "R"): NoteEvent => ({
  midi: 60,
  start,
  duration: 0.5,
  ...(hand ? { hand } : {}),
});
const st = (status: NoteStatus["status"]): NoteStatus => ({ status });

describe("weakSections", () => {
  it("buckets by time, filters <2 notes, sorts by ascending accuracy", () => {
    const notes = [note(0), note(1), note(5), note(6), note(9)];
    const states = [st("hit"), st("hit"), st("missed"), st("hit"), st("hit")];
    const weak = weakSections(notes, states, 4);
    // bucket 2 (start 9) has only 1 note -> excluded.
    expect(weak).toHaveLength(2);
    expect(weak[0]).toEqual({ start: 4, end: 8, accuracy: 0.5, count: 2 });
    expect(weak[1].start).toBe(0);
    expect(weak[1].accuracy).toBe(1);
  });

  it("respects the limit", () => {
    const notes = [note(0), note(1), note(4), note(5), note(8), note(9)];
    const states = notes.map(() => st("missed"));
    expect(weakSections(notes, states, 4, 2)).toHaveLength(2);
  });
});

describe("filterByHand", () => {
  const handed = [note(0, "R"), note(1, "L"), note(2, "R")];

  it("keeps only the requested hand", () => {
    expect(filterByHand(handed, "right")).toHaveLength(2);
    expect(filterByHand(handed, "left")).toHaveLength(1);
    expect(filterByHand(handed, "both")).toHaveLength(3);
  });

  it("is a no-op when the chart has no hand markers", () => {
    const plain = [note(0), note(1)];
    expect(filterByHand(plain, "right")).toHaveLength(2);
  });
});

describe("shouldFreeze (wait gate)", () => {
  it("freezes once the next pending note reaches the line", () => {
    const notes = [note(3.5)];
    const pending = [st("pending")];
    expect(shouldFreeze(notes, pending, 3.6)).toBe(true);
    expect(shouldFreeze(notes, pending, 3.4)).toBe(false);
  });

  it("does not freeze once the note is judged", () => {
    const notes = [note(3.5)];
    expect(shouldFreeze(notes, [st("hit")], 3.6)).toBe(false);
    expect(nextPendingIndex([st("hit")])).toBe(-1);
  });
});

describe("isMonophonic", () => {
  it("accepts a single melodic line", () => {
    expect(isMonophonic([note(0), note(1), note(2)])).toBe(true);
  });
  it("rejects overlapping notes (chords)", () => {
    const chord: NoteEvent[] = [
      { midi: 60, start: 0, duration: 1 },
      { midi: 64, start: 0.5, duration: 1 },
    ];
    expect(isMonophonic(chord)).toBe(false);
  });
});

describe("resetStatesInRange (loop wrap)", () => {
  it("re-arms notes inside the range and leaves others untouched", () => {
    const notes = [note(1), note(3), note(5)];
    const states = [st("hit"), st("hit"), st("missed")];
    const reset = resetStatesInRange(states, notes, 2, 4);
    expect(reset[0].status).toBe("hit"); // start 1 outside
    expect(reset[1].status).toBe("pending"); // start 3 inside
    expect(reset[2].status).toBe("missed"); // start 5 outside
  });
});
