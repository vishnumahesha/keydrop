import Link from "next/link";
import type { ChartSong } from "@/types/note";
import clsx from "clsx";

const DIFF_COLOR: Record<ChartSong["difficulty"], string> = {
  beginner: "bg-emerald-500/20 text-emerald-300",
  easy: "bg-sky-500/20 text-sky-300",
  medium: "bg-amber-500/20 text-amber-300",
  hard: "bg-rose-500/20 text-rose-300",
};

export function SongCard({ song, bestScore }: { song: ChartSong; bestScore?: number }) {
  return (
    <Link
      href={`/game/${song.id}`}
      className="group flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-sky-500/60 hover:bg-zinc-800/60"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-tight text-zinc-100 group-hover:text-white">
          {song.title}
        </h3>
        <span
          className={clsx(
            "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
            DIFF_COLOR[song.difficulty],
          )}
        >
          {song.difficulty}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs text-zinc-500">
        <span>{song.notes.length} notes</span>
        <span>{song.bpm} BPM</span>
        {bestScore != null && bestScore > 0 && (
          <span className="ml-auto text-sky-400">best {bestScore.toLocaleString()}</span>
        )}
      </div>
    </Link>
  );
}
