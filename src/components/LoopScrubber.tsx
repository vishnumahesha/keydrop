"use client";

import { useEffect, useRef } from "react";
import { useGame } from "@/store/game";

export function LoopScrubber() {
  const duration = useGame((s) => s.duration);
  const loopStart = useGame((s) => s.loopStart);
  const loopEnd = useGame((s) => s.loopEnd);
  const setLoop = useGame((s) => s.setLoop);
  const clearLoop = useGame((s) => s.clearLoop);

  const trackRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<number | null>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const { songTime, duration: d } = useGame.getState();
      if (headRef.current && d > 0) {
        headRef.current.style.left = `${Math.min(100, Math.max(0, (songTime / d) * 100))}%`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const timeAt = (clientX: number): number => {
    const el = trackRef.current;
    if (!el || duration <= 0) return 0;
    const r = el.getBoundingClientRect();
    const f = (clientX - r.left) / r.width;
    return Math.min(duration, Math.max(0, f * duration));
  };

  const hasLoop = loopStart != null && loopEnd != null;
  const pct = (t: number) => (duration > 0 ? (t / duration) * 100 : 0);

  return (
    <div className="flex items-center gap-2">
      <div
        ref={trackRef}
        className="relative h-6 flex-1 cursor-crosshair touch-none rounded bg-zinc-800"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          const t = timeAt(e.clientX);
          dragStart.current = t;
          setLoop(t, t);
        }}
        onPointerMove={(e) => {
          if (dragStart.current == null) return;
          const t = timeAt(e.clientX);
          setLoop(Math.min(dragStart.current, t), Math.max(dragStart.current, t));
        }}
        onPointerUp={() => {
          if (dragStart.current != null && loopEnd != null && loopStart != null && loopEnd - loopStart < 0.3) {
            clearLoop();
          }
          dragStart.current = null;
        }}
      >
        {hasLoop && (
          <div
            className="absolute top-0 h-full rounded bg-sky-500/30 ring-1 ring-sky-400"
            style={{ left: `${pct(loopStart)}%`, width: `${pct(loopEnd - loopStart)}%` }}
          />
        )}
        <div
          ref={headRef}
          className="absolute top-0 h-full w-0.5 bg-sky-300"
          style={{ left: "0%" }}
        />
      </div>
      {hasLoop ? (
        <button
          onClick={() => clearLoop()}
          className="rounded bg-zinc-700 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-600"
        >
          Clear loop
        </button>
      ) : (
        <span className="text-xs text-zinc-500">drag to loop</span>
      )}
    </div>
  );
}
