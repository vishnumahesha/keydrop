import { describe, it, expect } from "vitest";
import {
  noteToMidi,
  midiToNote,
  isBlackKey,
  buildChart,
  chartDuration,
  midiRange,
} from "@/lib/engine/chart";

describe("note <-> midi conversion", () => {
  it("maps names to MIDI numbers", () => {
    expect(noteToMidi("C4")).toBe(60);
    expect(noteToMidi("C#4")).toBe(61);
    expect(noteToMidi("Db4")).toBe(61);
    expect(noteToMidi("A0")).toBe(21);
    expect(noteToMidi("C5")).toBe(72);
    expect(noteToMidi("Bb3")).toBe(58);
  });

  it("maps MIDI numbers back to names", () => {
    expect(midiToNote(60)).toBe("C4");
    expect(midiToNote(61)).toBe("C#4");
    expect(midiToNote(72)).toBe("C5");
  });

  it("roundtrips through sharps", () => {
    for (const name of ["C4", "F#4", "A#3", "G5"]) {
      expect(midiToNote(noteToMidi(name))).toBe(name);
    }
  });

  it("throws on invalid names", () => {
    expect(() => noteToMidi("H4")).toThrow();
    expect(() => noteToMidi("C")).toThrow();
  });

  it("identifies black keys", () => {
    expect(isBlackKey(61)).toBe(true); // C#4
    expect(isBlackKey(63)).toBe(true); // D#4
    expect(isBlackKey(60)).toBe(false); // C4
    expect(isBlackKey(64)).toBe(false); // E4
  });
});

describe("buildChart", () => {
  it("lays steps end to end with beat-derived timing", () => {
    const notes = buildChart(60, [
      ["C4", 1],
      ["D4", 2],
    ]);
    expect(notes).toHaveLength(2);
    expect(notes[0].start).toBe(0);
    expect(notes[0].midi).toBe(60);
    expect(notes[1].start).toBeCloseTo(1, 5); // 1 beat at 60bpm = 1s
    expect(notes[1].midi).toBe(62);
    // duration is the beat span minus a small gap
    expect(notes[1].duration).toBeLessThan(2);
    expect(notes[1].duration).toBeGreaterThan(1.9);
  });

  it("treats R as a rest that advances time without a note", () => {
    const notes = buildChart(60, [
      ["C4", 1],
      ["R", 1],
      ["E4", 1],
    ]);
    expect(notes).toHaveLength(2);
    expect(notes[1].midi).toBe(64);
    expect(notes[1].start).toBeCloseTo(2, 5);
  });

  it("carries the optional hand annotation", () => {
    const notes = buildChart(120, [["C4", 1, "L"]]);
    expect(notes[0].hand).toBe("L");
  });
});

describe("chart analysis helpers", () => {
  it("computes total duration from the last note's end", () => {
    const notes = buildChart(60, [
      ["C4", 1],
      ["D4", 1],
    ]);
    expect(chartDuration(notes)).toBeCloseTo(notes[1].start + notes[1].duration, 5);
  });

  it("finds the min/max midi range", () => {
    const notes = buildChart(120, [
      ["C4", 1],
      ["G4", 1],
      ["E4", 1],
    ]);
    expect(midiRange(notes)).toEqual({ min: 60, max: 67 });
  });

  it("falls back to one octave for an empty chart", () => {
    expect(midiRange([])).toEqual({ min: 60, max: 72 });
  });
});
