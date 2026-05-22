"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useGame } from "@/store/game";
import { computeLatencyOffset, tapError } from "@/lib/engine/latency";

const BEAT_MS = 600; // 100 BPM
const BEATS = 8;

function click(ctx: AudioContext, accent: boolean) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.frequency.value = accent ? 1500 : 1000;
  o.connect(g);
  g.connect(ctx.destination);
  const t = ctx.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.3, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  o.start(t);
  o.stop(t + 0.06);
}

export default function CalibratePage() {
  const setLatencyOffset = useGame((s) => s.setLatencyOffset);
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [beat, setBeat] = useState(0);
  const [offset, setOffset] = useState<number | null>(null);
  const [current, setCurrent] = useState(0);
  const [saved, setSaved] = useState(false);

  const errors = useRef<number[]>([]);
  const t0 = useRef(0);
  const ctxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const v = Number(window.localStorage.getItem("keydrop.latencyMs"));
    if (!Number.isNaN(v)) queueMicrotask(() => setCurrent(v));
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || phase !== "running") return;
      e.preventDefault();
      errors.current.push(tapError(performance.now() - t0.current, BEAT_MS));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  const start = () => {
    const ctx = ctxRef.current ?? new AudioContext();
    ctxRef.current = ctx;
    void ctx.resume();
    errors.current = [];
    setOffset(null);
    setSaved(false);
    setPhase("running");
    t0.current = performance.now();

    let n = 0;
    const tick = () => {
      n += 1;
      click(ctx, (n - 1) % 4 === 0);
      setBeat(n);
      if (n >= BEATS) {
        window.clearInterval(intervalRef.current);
        window.setTimeout(() => {
          setPhase("done");
          setOffset(computeLatencyOffset(errors.current));
        }, BEAT_MS);
      }
    };
    tick();
    intervalRef.current = window.setInterval(tick, BEAT_MS);
  };

  const save = () => {
    if (offset == null) return;
    window.localStorage.setItem("keydrop.latencyMs", String(offset));
    setLatencyOffset(offset / 1000);
    setCurrent(offset);
    setSaved(true);
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-4 py-10">
      <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-200">
        ← Songs
      </Link>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-zinc-50">Latency calibration</h1>
        <p className="text-sm text-zinc-400">
          Press the spacebar in time with 8 metronome clicks. We measure your
          input lag and correct scoring for it.
        </p>
      </header>

      <p className="text-sm text-zinc-300">
        Current offset:{" "}
        <span className="font-semibold tabular-nums">{current} ms</span>
      </p>

      {phase === "running" && (
        <div className="flex flex-col items-center gap-2 py-6">
          <div className="text-5xl font-bold tabular-nums text-sky-400">
            {beat}/{BEATS}
          </div>
          <p className="text-sm text-zinc-400">Tap space on each click…</p>
        </div>
      )}

      {phase === "done" && offset != null && (
        <div className="flex flex-col items-center gap-3 rounded-lg bg-zinc-900 py-6">
          <p className="text-sm text-zinc-400">Measured offset</p>
          <p className="text-4xl font-bold tabular-nums text-sky-400">{offset} ms</p>
          <div className="flex gap-2">
            <button
              onClick={save}
              className="rounded-lg bg-sky-500 px-5 py-2 font-semibold text-white hover:bg-sky-400"
            >
              {saved ? "Saved ✓" : "Save"}
            </button>
            <button
              onClick={start}
              className="rounded-lg bg-zinc-700 px-5 py-2 font-semibold text-white hover:bg-zinc-600"
            >
              Redo
            </button>
          </div>
        </div>
      )}

      {phase === "idle" && (
        <button
          onClick={start}
          className="rounded-lg bg-sky-500 px-6 py-3 font-semibold text-white hover:bg-sky-400"
        >
          Start calibration
        </button>
      )}
    </main>
  );
}
