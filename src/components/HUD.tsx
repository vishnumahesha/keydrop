"use client";

import { useGame, accuracy, LEAD_IN } from "@/store/game";

export function HUD() {
  const score = useGame((s) => s.score);
  const streak = useGame((s) => s.streak);
  const hits = useGame((s) => s.hits);
  const attempts = useGame((s) => s.attempts);
  const songTime = useGame((s) => s.songTime);
  const duration = useGame((s) => s.duration);

  const acc = Math.round(accuracy({ hits, attempts }) * 100);
  const total = Math.max(0.001, duration);
  const progress = Math.round(
    Math.min(100, Math.max(0, ((songTime - LEAD_IN) / (total - LEAD_IN)) * 100)),
  );

  return (
    <div className="flex w-full items-stretch gap-2 text-zinc-100">
      <Stat label="Score" value={score.toLocaleString()} />
      <Stat label="Streak" value={`${streak}`} accent={streak >= 5} />
      <Stat label="Accuracy" value={`${acc}%`} />
      <div className="flex flex-1 flex-col justify-center rounded-lg bg-zinc-800/70 px-3 py-2">
        <span className="text-[10px] uppercase tracking-wide text-zinc-400">
          Progress
        </span>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-zinc-700">
          <div
            className="h-full rounded-full bg-sky-400 transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex min-w-16 flex-col rounded-lg bg-zinc-800/70 px-3 py-2">
      <span className="text-[10px] uppercase tracking-wide text-zinc-400">
        {label}
      </span>
      <span
        className={
          "text-lg font-bold tabular-nums " +
          (accent ? "text-amber-400" : "text-zinc-50")
        }
      >
        {value}
      </span>
    </div>
  );
}
