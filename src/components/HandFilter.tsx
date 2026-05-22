"use client";

import { useGame } from "@/store/game";
import { SONGS } from "@/lib/songs";
import { chartHasHands } from "@/lib/engine/practice";
import type { HandFilter as HandFilterValue } from "@/types/note";
import clsx from "clsx";

const ANY_HANDS = SONGS.some((s) => chartHasHands(s.notes));

const OPTIONS: { id: HandFilterValue; label: string }[] = [
  { id: "both", label: "Both hands" },
  { id: "right", label: "Right" },
  { id: "left", label: "Left" },
];

export function HandFilter() {
  const handFilter = useGame((s) => s.handFilter);
  const setHandFilter = useGame((s) => s.setHandFilter);
  const opts = ANY_HANDS ? OPTIONS : OPTIONS.slice(0, 1);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {opts.map((o) => (
        <button
          key={o.id}
          onClick={() => setHandFilter(o.id)}
          className={clsx(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            handFilter === o.id
              ? "bg-sky-500 text-white"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700",
          )}
        >
          {o.label}
        </button>
      ))}
      {!ANY_HANDS && (
        <span className="text-xs text-zinc-500">
          Hand split unlocks with imported MIDI (v0.7)
        </span>
      )}
    </div>
  );
}
