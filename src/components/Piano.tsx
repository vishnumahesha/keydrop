"use client";

import { useGame } from "@/store/game";
import { isBlackKey, midiToNote } from "@/lib/engine/chart";
import { keyForMidi } from "@/lib/input/keyboard";
import clsx from "clsx";

export function Piano() {
  const mode = useGame((s) => s.mode);
  const activeKeys = useGame((s) => s.activeKeys);
  const keyMin = useGame((s) => s.keyMin);
  const keyMax = useGame((s) => s.keyMax);
  const kbBase = useGame((s) => s.kbBase);
  const showLetters = mode === "keyboard";

  const press = (midi: number) =>
    useGame.getState().noteOn(midi, useGame.getState().songTime);
  const release = (midi: number) =>
    useGame.getState().noteOff(midi, useGame.getState().songTime);

  const white: number[] = [];
  const black: { midi: number; afterWhite: number }[] = [];
  for (let m = keyMin; m <= keyMax; m++) {
    if (isBlackKey(m)) black.push({ midi: m, afterWhite: white.length - 1 });
    else white.push(m);
  }
  const whitePct = 100 / white.length;

  return (
    <div className="w-full touch-none select-none overflow-x-auto px-2 pb-3">
      <div
        className="relative mx-auto flex h-40"
        style={{ minWidth: `${white.length * 38}px` }}
      >
        {white.map((midi) => {
          const active = activeKeys.includes(midi);
          const letter = keyForMidi(midi, kbBase);
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
              {showLetters && letter && (
                <span className="text-xs font-semibold text-zinc-500">{letter}</span>
              )}
            </button>
          );
        })}

        {black.map(({ midi, afterWhite }) => {
          const active = activeKeys.includes(midi);
          const letter = keyForMidi(midi, kbBase);
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
              {showLetters && letter && (
                <span className="text-[10px] font-semibold text-zinc-300">{letter}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
