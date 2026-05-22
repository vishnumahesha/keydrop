"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Clock } from "@/lib/engine/clock";
import { useGame } from "@/store/game";
import { getSong, SONG_MAP } from "@/lib/songs";
import { listImported, recordScore } from "@/lib/storage/db";
import { shouldFreeze, isMonophonic } from "@/lib/engine/practice";
import { useKeyboardInput } from "@/lib/input/keyboard";
import { useMidiInput } from "@/lib/input/midi";
import { useMicInput } from "@/lib/input/mic";
import { midiToNote } from "@/lib/engine/chart";
import { ensureAudio } from "@/lib/audio/synth";
import { HUD } from "@/components/HUD";
import { FallingNotes } from "@/components/FallingNotes";
import { Piano } from "@/components/Piano";
import { LoopScrubber } from "@/components/LoopScrubber";
import { EndReport } from "@/components/EndReport";

const SPEEDS = [0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.25];

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
  const speed = useGame((s) => s.speed);
  const setSpeed = useGame((s) => s.setSpeed);
  const setLoop = useGame((s) => s.setLoop);
  const setLatencyOffset = useGame((s) => s.setLatencyOffset);
  const shiftOctave = useGame((s) => s.shiftOctave);
  const canShift = useGame((s) => s.keyMax - s.keyMin > 12);

  const notes = useGame((s) => s.notes);
  const monophonic = useMemo(() => isMonophonic(notes), [notes]);

  useKeyboardInput(true);
  const midi = useMidiInput(mode === "midi");
  const mic = useMicInput(mode === "mic");

  // Apply the saved input-latency offset.
  useEffect(() => {
    const ms = Number(window.localStorage.getItem("keydrop.latencyMs"));
    if (!Number.isNaN(ms)) setLatencyOffset(ms / 1000);
  }, [setLatencyOffset]);

  // Load the song (built-in or imported), then restore its last-used speed.
  useEffect(() => {
    let cancelled = false;
    const builtin = SONG_MAP[songId];
    if (builtin) {
      loadSong(builtin);
    } else {
      listImported().then((list) => {
        if (cancelled) return;
        loadSong(list.find((s) => s.id === songId) ?? getSong(songId));
      });
    }
    const saved = Number(window.localStorage.getItem(`keydrop.speed.${songId}`));
    if (SPEEDS.includes(saved)) setSpeed(saved);
    return () => {
      cancelled = true;
    };
  }, [songId, loadSong, setSpeed]);

  // Persist the best score for this chart when a run finishes.
  useEffect(() => {
    if (finished) void recordScore(songId, useGame.getState().score);
  }, [finished, songId]);

  // Persist speed per song and keep the running clock in sync.
  useEffect(() => {
    window.localStorage.setItem(`keydrop.speed.${songId}`, String(speed));
    clockRef.current?.setSpeed(speed);
  }, [speed, songId]);

  useEffect(() => {
    const clock = new Clock((songTime) => {
      const s = useGame.getState();
      // Loop wraparound: jump back and re-arm the notes inside the range.
      if (s.loopStart != null && s.loopEnd != null && songTime > s.loopEnd) {
        clock.setTime(s.loopStart);
        s.loopReset(s.loopStart, s.loopEnd);
        return;
      }
      s.tick(songTime);
      const after = useGame.getState();
      if (after.finished) {
        clock.stop();
        setRunning(false);
        return;
      }
      if (after.waitMode && shouldFreeze(after.notes, after.noteStates, songTime)) {
        clock.freeze();
      } else {
        clock.unfreeze();
      }
    });
    clockRef.current = clock;
    return () => clock.stop();
  }, []);

  const begin = (startAt?: number) => {
    void ensureAudio();
    startGame();
    const clock = clockRef.current;
    if (!clock) return;
    clock.setSpeed(useGame.getState().speed);
    clock.start();
    if (startAt != null) clock.setTime(startAt);
    setRunning(true);
  };

  const handleStop = () => {
    clockRef.current?.stop();
    stopGame();
    setRunning(false);
    loadSong(getSong(songId));
  };

  const handlePractice = (start: number, end: number) => {
    setLoop(start, end);
    setSpeed(0.7);
    begin(start);
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
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-zinc-400">
            <input
              type="checkbox"
              checked={waitMode}
              onChange={(e) => setWaitMode(e.target.checked)}
              className="accent-sky-400"
            />
            Wait
          </label>
          <select
            aria-label="Speed"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="rounded-md bg-zinc-800 px-1.5 py-1 text-xs text-zinc-200"
          >
            {SPEEDS.map((sp) => (
              <option key={sp} value={sp}>
                {Math.round(sp * 100)}%
              </option>
            ))}
          </select>
        </div>
      </header>

      {mode === "midi" && (
        <div
          className={
            "rounded-md px-3 py-1.5 text-xs " +
            (!midi.supported
              ? "bg-amber-500/15 text-amber-300"
              : midi.devices.length
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-zinc-800 text-zinc-400")
          }
        >
          {!midi.supported
            ? "Web MIDI isn't available in this browser. Use Chrome or Edge."
            : midi.devices.length
              ? `Connected: ${midi.devices.join(", ")}`
              : "No MIDI device detected. Plug one in and grant access."}
        </div>
      )}

      {mode === "mic" && (
        <div className="flex items-center justify-between gap-2 rounded-md bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300">
          {!mic.supported ? (
            <span className="text-amber-300">Microphone isn&apos;t available in this browser.</span>
          ) : !monophonic ? (
            <span className="text-amber-300">Mic mode is melody-only — this song has chords.</span>
          ) : mic.calibrating ? (
            <span>Calibrating room noise… stay quiet for a moment.</span>
          ) : mic.listening ? (
            <span className="text-emerald-300">
              Listening{mic.detectedMidi != null ? ` · heard ${midiToNote(mic.detectedMidi)}` : ""} · melody only
            </span>
          ) : (
            <>
              <span>Play single notes into the mic.</span>
              <button
                onClick={() => mic.enable()}
                className="rounded bg-sky-500 px-3 py-1 font-semibold text-white hover:bg-sky-400"
              >
                Enable mic
              </button>
            </>
          )}
        </div>
      )}

      <HUD />

      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0">
          <FallingNotes />
        </div>
        {finished && <EndReport onRetry={() => begin()} onPractice={handlePractice} />}
      </div>

      <LoopScrubber />

      <div className="flex items-center justify-center gap-2">
        {!running ? (
          <button
            onClick={() => begin()}
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
        {canShift && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => shiftOctave(-1)}
              aria-label="Octave down"
              className="rounded-md bg-zinc-800 px-2 py-2 text-zinc-200 hover:bg-zinc-700"
            >
              ◀
            </button>
            <button
              onClick={() => shiftOctave(1)}
              aria-label="Octave up"
              className="rounded-md bg-zinc-800 px-2 py-2 text-zinc-200 hover:bg-zinc-700"
            >
              ▶
            </button>
          </div>
        )}
        <span className="text-xs text-zinc-500">
          {mode === "keyboard"
            ? canShift
              ? "Type the key letters · Z/X shift octave"
              : "Type the letters on the keys"
            : "Tap the keys"}
        </span>
      </div>

      <Piano />
    </main>
  );
}
