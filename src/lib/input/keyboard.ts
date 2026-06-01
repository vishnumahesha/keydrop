"use client";

import { useEffect } from "react";
import { useGame } from "@/store/game";

/**
 * Two-octave piano layout relative to kbBase.
 *
 * Bottom row (lower octave, offsets 0–11):
 *   white  Z  X  C  V  B  N  M   → C D E F G A B
 *   black  S  D     G  H  J       → C# D# F# G# A#
 *
 * Top row (upper octave, offsets 12–23):
 *   white  Q  W  E  R  T  Y  U   → C D E F G A B (+8va)
 *   black  2  3     5  6  7       → C# D# F# G# A# (+8va)
 *
 * [ / ] shift kbBase for charts wider than 2 octaves.
 */
const KEY_TO_OFFSET: Record<string, number> = {
  // lower octave
  z: 0,  s: 1,  x: 2,  d: 3,  c: 4,
  v: 5,  g: 6,  b: 7,  h: 8,  n: 9,  j: 10, m: 11,
  // upper octave
  q: 12, 2: 13, w: 14, 3: 15, e: 16,
  r: 17, 5: 18, t: 19, 6: 20, y: 21, 7: 22, u: 23,
};

const OFFSET_TO_KEY: Record<number, string> = {
  0: "Z",  1: "S",  2: "X",  3: "D",  4: "C",
  5: "V",  6: "G",  7: "B",  8: "H",  9: "N",  10: "J", 11: "M",
  12: "Q", 13: "2", 14: "W", 15: "3", 16: "E",
  17: "R", 18: "5", 19: "T", 20: "6", 21: "Y", 22: "7", 23: "U",
};

/** The computer key label for a midi note given the current keyboard base, or null. */
export function keyForMidi(midi: number, kbBase: number): string | null {
  return OFFSET_TO_KEY[midi - kbBase] ?? null;
}

/** Routes physical key presses into the game store. */
export function useKeyboardInput(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;

    const down = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === "[") {
        e.preventDefault();
        useGame.getState().shiftOctave(-1);
        return;
      }
      if (key === "]") {
        e.preventDefault();
        useGame.getState().shiftOctave(1);
        return;
      }
      const offset = KEY_TO_OFFSET[key];
      if (offset === undefined) return;
      e.preventDefault();
      const { songTime, kbBase, noteOn } = useGame.getState();
      noteOn(kbBase + offset, songTime);
    };

    const up = (e: KeyboardEvent) => {
      const offset = KEY_TO_OFFSET[e.key.toLowerCase()];
      if (offset === undefined) return;
      const { songTime, kbBase, noteOff } = useGame.getState();
      noteOff(kbBase + offset, songTime);
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [enabled]);
}
