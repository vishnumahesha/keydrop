import Link from "next/link";
import { useGame, accuracy } from "@/store/game";
import { weakSections } from "@/lib/engine/practice";
import { midiToNote } from "@/lib/engine/chart";
import { TimingHistogram } from "@/components/TimingHistogram";

export function EndReport({
  onRetry,
  onPractice,
}: {
  onRetry: () => void;
  onPractice: (start: number, end: number) => void;
}) {
  const score = useGame((s) => s.score);
  const hits = useGame((s) => s.hits);
  const attempts = useGame((s) => s.attempts);
  const maxStreak = useGame((s) => s.maxStreak);
  const notes = useGame((s) => s.notes);
  const noteStates = useGame((s) => s.noteStates);
  const acc = Math.round(accuracy({ hits, attempts }) * 100);
  const weak = weakSections(notes, noteStates);

  return (
    <div className="absolute inset-0 flex flex-col items-center gap-3 overflow-y-auto rounded-lg bg-zinc-950/90 p-4 backdrop-blur-sm">
      <h2 className="text-2xl font-bold text-zinc-50">Song complete</h2>

      <div className="grid w-full max-w-sm grid-cols-2 gap-x-8 gap-y-1 text-center text-zinc-200">
        <span className="text-zinc-400">Score</span>
        <span className="font-semibold tabular-nums">{score.toLocaleString()}</span>
        <span className="text-zinc-400">Notes hit</span>
        <span className="font-semibold tabular-nums">{hits}/{notes.length}</span>
        <span className="text-zinc-400">Accuracy</span>
        <span className="font-semibold tabular-nums">{acc}%</span>
        <span className="text-zinc-400">Best streak</span>
        <span className="font-semibold tabular-nums">{maxStreak}</span>
      </div>

      <div className="w-full max-w-md">
        <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Timing</p>
        <TimingHistogram />
      </div>

      {weak.length > 0 && (
        <div className="w-full max-w-md">
          <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">
            Weak sections
          </p>
          <div className="flex flex-col gap-1.5">
            {weak.map((w) => {
              const first = notes.find((n) => n.start >= w.start && n.start < w.end);
              return (
                <div
                  key={w.start}
                  className="flex items-center justify-between gap-2 rounded-md bg-zinc-800/70 px-3 py-2 text-sm"
                >
                  <span className="text-zinc-300">
                    {first ? midiToNote(first.midi) : "—"} · {Math.round(w.accuracy * 100)}%
                  </span>
                  <button
                    onClick={() => onPractice(w.start, w.end)}
                    className="rounded bg-sky-500 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-400"
                  >
                    Practice at 70%
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-1 flex gap-2">
        <button
          onClick={onRetry}
          className="rounded-lg bg-sky-500 px-5 py-2 font-semibold text-white hover:bg-sky-400"
        >
          Play again
        </button>
        <Link
          href="/"
          className="rounded-lg bg-zinc-700 px-5 py-2 font-semibold text-white hover:bg-zinc-600"
        >
          Choose song
        </Link>
      </div>
    </div>
  );
}
