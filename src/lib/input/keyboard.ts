"use client";

import { useEffect } from "react";
import { useGame } from "@/store/game";

/** Computer-keyboard layout for the C4..C5 octave (white: A S D F G H J K, black: W E T Y U). */
export const KEY_TO_MIDI: Record<string, number> = {
  a: 60, // C4
  w: 61, // C#4
  s: 62, // D4
  e: 63, // D#4
  d: 64, // E4
  f: 65, // F4
  t: 66, // F#4
  g: 67, // G4
  y: 68, // G#4
  h: 69, // A4
  u: 70, // A#4
  j: 71, // B4
  k: 72, // C5
};

export const MIDI_TO_KEY: Record<number, string> = Object.fromEntries(
  Object.entries(KEY_TO_MIDI).map(([key, midi]) => [midi, key.toUpperCase()]),
);

/** Side-effect hook: routes physical key presses into the game store. */
export function useKeyboardInput(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;

    const down = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const midi = KEY_TO_MIDI[e.key.toLowerCase()];
      if (midi === undefined) return;
      e.preventDefault();
      const { songTime, noteOn } = useGame.getState();
      noteOn(midi, songTime);
    };

    const up = (e: KeyboardEvent) => {
      const midi = KEY_TO_MIDI[e.key.toLowerCase()];
      if (midi === undefined) return;
      const { songTime, noteOff } = useGame.getState();
      noteOff(midi, songTime);
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [enabled]);
}
