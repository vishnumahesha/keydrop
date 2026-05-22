"use client";

import { useEffect } from "react";
import { useGame } from "@/store/game";

/**
 * Computer-keyboard layout, relative to the current octave base.
 * White: A S D F G H J K (C D E F G A B C). Black: W E T Y U.
 * Z / X shift the playable octave down / up.
 */
const KEY_TO_OFFSET: Record<string, number> = {
  a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11, k: 12,
};

const OFFSET_TO_KEY: Record<number, string> = {
  0: "A", 1: "W", 2: "S", 3: "E", 4: "D", 5: "F", 6: "T",
  7: "G", 8: "Y", 9: "H", 10: "U", 11: "J", 12: "K",
};

/** The computer key for a midi note in the current octave, or null if out of reach. */
export function keyForMidi(midi: number, kbBase: number): string | null {
  return OFFSET_TO_KEY[midi - kbBase] ?? null;
}

/** Side-effect hook: routes physical key presses into the game store. */
export function useKeyboardInput(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;

    const down = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === "z") {
        e.preventDefault();
        useGame.getState().shiftOctave(-1);
        return;
      }
      if (key === "x") {
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
