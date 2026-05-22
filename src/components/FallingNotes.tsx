"use client";

import { useEffect, useRef } from "react";
import { useGame, LEAD_IN } from "@/store/game";
import { isBlackKey } from "@/lib/engine/chart";

const LOOKAHEAD = LEAD_IN; // seconds visible above the hit line
const TOP_PAD = 8;

type Lane = { center: number; width: number; black: boolean };

/** Per-midi horizontal lanes (fractions of width) matching the piano range. */
function buildLanes(keyMin: number, keyMax: number): Map<number, Lane> {
  let whiteCount = 0;
  for (let m = keyMin; m <= keyMax; m++) if (!isBlackKey(m)) whiteCount++;
  const w = 1 / Math.max(1, whiteCount);
  const lanes = new Map<number, Lane>();
  let whiteIdx = 0;
  for (let m = keyMin; m <= keyMax; m++) {
    if (isBlackKey(m)) {
      lanes.set(m, { center: whiteIdx * w, width: w * 0.6, black: true });
    } else {
      lanes.set(m, { center: (whiteIdx + 0.5) * w, width: w * 0.82, black: false });
      whiteIdx++;
    }
  }
  return lanes;
}

export function FallingNotes() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let cssW = 0;
    let cssH = 0;
    let lanes = buildLanes(60, 72);
    let lanesKey = "60-72";

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      cssW = rect.width;
      cssH = rect.height;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      const { notes, noteStates, songTime, keyMin, keyMax } = useGame.getState();
      const key = `${keyMin}-${keyMax}`;
      if (key !== lanesKey) {
        lanes = buildLanes(keyMin, keyMax);
        lanesKey = key;
      }
      const hitY = cssH - 6;
      const pxPerSec = (hitY - TOP_PAD) / LOOKAHEAD;

      ctx.clearRect(0, 0, cssW, cssH);
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, cssW, cssH);

      ctx.save();
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 16;
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, hitY);
      ctx.lineTo(cssW, hitY);
      ctx.stroke();
      ctx.restore();

      for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        const dt = note.start - songTime;
        if (dt > LOOKAHEAD || note.start + note.duration < songTime - 0.3) continue;
        const lane = lanes.get(note.midi);
        if (!lane) continue;

        const yHit = hitY - dt * pxPerSec;
        const h = Math.max(10, note.duration * pxPerSec);
        const y = yHit - h;
        const x = lane.center * cssW - (lane.width * cssW) / 2;
        const w = lane.width * cssW;

        const state = noteStates[i]?.status ?? "pending";
        if (state === "hit") {
          ctx.fillStyle = "#22c55e";
        } else if (state === "missed") {
          ctx.fillStyle = "#ef4444";
        } else {
          const g = ctx.createLinearGradient(0, y, 0, y + h);
          g.addColorStop(0, lane.black ? "#a855f7" : "#3b82f6");
          g.addColorStop(1, lane.black ? "#7c3aed" : "#2563eb");
          ctx.fillStyle = g;
        }
        roundRect(ctx, x, y, w, h, 4);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="h-full w-full rounded-lg" />;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}
