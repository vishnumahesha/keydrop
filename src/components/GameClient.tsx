"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Clock } from "@/lib/engine/clock";
import { useGame, accuracy } from "@/store/game";
import { getSong } from "@/lib/songs";
import { useKeyboardInput } from "@/lib/input/keyboard";
import { ensureAudio } from "@/lib/audio/synth";
import { HUD } from "@/components/HUD";
import { FallingNotes } from "@/components/FallingNotes";
import { Piano } from "@/components/Piano";

export function GameClient({ songId }: { songId: string }) {
  const clockRef = useRef<Clock | null>(null);
  const [running, setRunning] = useState(false);

  const loadSong = useGame((s) => s.loadSong);
  const startGame = useGame((s) => s.start);
  const stopGame = useGame((s) => s.stop);
  const song = useGame((s) => s.song);
  const finished = useGame((s) => s.finished);
  const mode = useGame((s) => s.mode);
  const waitMode = useGame((s) => s.waitMode);
  const setWaitMode = useGame((s) => s.setWaitMode);

  useKeyboardInput(true);

  useEffect(() => {
    loadSong(getSong(songId));
  }, [songId, loadSong]);

  useEffect(() => {
    const clock = new Clock((songTime) => {
      useGame.getState().tick(songTime);
      const s = useGame.getState();
      if (s.finished) {
        clock.stop();
        setRunning(false);
        return;
      }
      if (s.waitMode) {
        const next = s.notes.find((_, i) => s.noteStates[i]?.status === "pending");
        if (next && songTime >= next.start) clock.freeze();
        else clock.unfreeze();
      }
    });
    clockRef.current = clock;
    return () => clock.stop();
  }, []);

  const handleStart = () => {
    void ensureAudio(); // unlock + load samples on this user gesture
    startGame();
    clockRef.current?.start();
    setRunning(true);
  };

  const handleStop = () => {
    clockRef.current?.stop();
    stopGame();
    setRunning(false);
    loadSong(getSong(songId));
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-3 px-3 py-4">
      <header className="flex items-center justify-between gap-2">
        <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-200">
          ← Songs
        </Link>
        <h1 className="truncate text-sm font-semibold text-zinc-100">
          {song?.title ?? "Loading…"}
        </h1>
        <label className="flex items-center gap-1.5 text-xs text-zinc-400">
          <input
            type="checkbox"
            checked={waitMode}
            onChange={(e) => setWaitMode(e.target.checked)}
            className="accent-sky-400"
          />
          Wait
        </label>
      </header>

      <HUD />

      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0">
          <FallingNotes />
        </div>
        {finished && <FinishOverlay onRetry={handleStart} />}
      </div>

      <div className="flex items-center justify-center gap-2">
        {!running ? (
          <button
            onClick={handleStart}
            className="rounded-lg bg-sky-500 px-6 py-2 font-semibold text-white hover:bg-sky-400"
          >
            {finished ? "Play again" : "Start"}
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="rounded-lg bg-zinc-700 px-6 py-2 font-semibold text-white hover:bg-zinc-600"
          >
            Stop
          </button>
        )}
        <span className="text-xs text-zinc-500">
          {mode === "keyboard" ? "Type the letters on the keys" : "Tap the keys"}
        </span>
      </div>

      <Piano />
    </main>
  );
}

function FinishOverlay({ onRetry }: { onRetry: () => void }) {
  const score = useGame((s) => s.score);
  const hits = useGame((s) => s.hits);
  const attempts = useGame((s) => s.attempts);
  const maxStreak = useGame((s) => s.maxStreak);
  const total = useGame((s) => s.notes.length);
  const acc = Math.round(accuracy({ hits, attempts }) * 100);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg bg-zinc-950/85 backdrop-blur-sm">
      <h2 className="text-2xl font-bold text-zinc-50">Song complete</h2>
      <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-center text-zinc-200">
        <span className="text-zinc-400">Score</span>
        <span className="font-semibold tabular-nums">{score.toLocaleString()}</span>
        <span className="text-zinc-400">Notes hit</span>
        <span className="font-semibold tabular-nums">{hits}/{total}</span>
        <span className="text-zinc-400">Accuracy</span>
        <span className="font-semibold tabular-nums">{acc}%</span>
        <span className="text-zinc-400">Best streak</span>
        <span className="font-semibold tabular-nums">{maxStreak}</span>
      </div>
      <div className="mt-2 flex gap-2">
        <button
          onClick={onRetry}
          className="rounded-lg bg-sky-500 px-5 py-2 font-semibold text-white hover:bg-sky-400"
        >
          Retry
        </button>
        <Link
          href="/"
          className="rounded-lg bg-zinc-700 px-5 py-2 font-semibold text-white hover:bg-zinc-600"
        >
          Songs
        </Link>
      </div>
    </div>
  );
}
