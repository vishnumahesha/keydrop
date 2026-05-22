"use client";

import { useGame } from "@/store/game";
import type { InputMode } from "@/types/note";
import clsx from "clsx";

const MODES: { id: InputMode; label: string; ready: boolean }[] = [
  { id: "keyboard", label: "Laptop keys", ready: true },
  { id: "touch", label: "Touch", ready: true },
  { id: "midi", label: "MIDI piano", ready: true },
  { id: "mic", label: "Mic", ready: false },
];

export function ModeSelect() {
  const mode = useGame((s) => s.mode);
  const setMode = useGame((s) => s.setMode);

  return (
    <div className="flex flex-wrap gap-2">
      {MODES.map((m) => (
        <button
          key={m.id}
          disabled={!m.ready}
          onClick={() => m.ready && setMode(m.id)}
          className={clsx(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            !m.ready && "cursor-not-allowed bg-zinc-800 text-zinc-600",
            m.ready && mode === m.id && "bg-sky-500 text-white",
            m.ready && mode !== m.id && "bg-zinc-800 text-zinc-300 hover:bg-zinc-700",
          )}
        >
          {m.label}
          {!m.ready && <span className="ml-1 text-[10px]">soon</span>}
        </button>
      ))}
    </div>
  );
}
