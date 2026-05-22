"use client";

import { useGame, MIN_MIDI, MAX_MIDI } from "@/store/game";
import { isBlackKey, midiToNote } from "@/lib/engine/chart";
import { MIDI_TO_KEY } from "@/lib/input/keyboard";
import clsx from "clsx";

const WHITE: number[] = [];
const BLACK: { midi: number; afterWhite: number }[] = [];
for (let m = MIN_MIDI; m <= MAX_MIDI; m++) {
  if (isBlackKey(m)) {
    BLACK.push({ midi: m, afterWhite: WHITE.length - 1 });
  } else {
    WHITE.push(m);
  }
}

export function Piano() {
  const mode = useGame((s) => s.mode);
  const activeKeys = useGame((s) => s.activeKeys);
  const showLetters = mode === "keyboard";

  const press = (midi: number) => useGame.getState().noteOn(midi, useGame.getState().songTime);
  const release = (midi: number) => useGame.getState().noteOff(midi, useGame.getState().songTime);

  const whitePct = 100 / WHITE.length;

  return (
    <div className="w-full select-none px-2 pb-3">
      <div className="relative mx-auto flex h-40 w-full max-w-2xl touch-none">
        {WHITE.map((midi) => {
          const active = activeKeys.includes(midi);
          return (
            <button
              key={midi}
              aria-label={midiToNote(midi)}
              onPointerDown={(e) => {
                e.preventDefault();
                e.currentTarget.setPointerCapture(e.pointerId);
                press(midi);
              }}
              onPointerUp={() => release(midi)}
              onPointerLeave={(e) => {
                if (e.buttons) release(midi);
              }}
              className={clsx(
                "relative flex flex-1 items-end justify-center rounded-b-md border border-zinc-300 pb-2 transition-colors",
                active ? "bg-sky-300" : "bg-white hover:bg-sky-50",
              )}
            >
              {showLetters && (
                <span className="text-xs font-semibold text-zinc-500">
                  {MIDI_TO_KEY[midi]}
                </span>
              )}
            </button>
          );
        })}

        {BLACK.map(({ midi, afterWhite }) => {
          const active = activeKeys.includes(midi);
          const left = `calc(${(afterWhite + 1) * whitePct}% - ${whitePct * 0.32}%)`;
          return (
            <button
              key={midi}
              aria-label={midiToNote(midi)}
              style={{ left, width: `${whitePct * 0.64}%` }}
              onPointerDown={(e) => {
                e.preventDefault();
                e.currentTarget.setPointerCapture(e.pointerId);
                press(midi);
              }}
              onPointerUp={() => release(midi)}
              onPointerLeave={(e) => {
                if (e.buttons) release(midi);
              }}
              className={clsx(
                "absolute top-0 z-10 flex h-24 items-end justify-center rounded-b-md pb-1 transition-colors",
                active ? "bg-sky-500" : "bg-zinc-900 hover:bg-zinc-700",
              )}
            >
              {showLetters && (
                <span className="text-[10px] font-semibold text-zinc-300">
                  {MIDI_TO_KEY[midi]}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
