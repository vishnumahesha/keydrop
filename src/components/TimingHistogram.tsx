"use client";

import { useEffect, useRef } from "react";
import { useGame } from "@/store/game";

const BUCKETS = 12; // 50ms each, -300ms..+300ms

export function TimingHistogram() {
  const ref = useRef<HTMLCanvasElement>(null);
  const judgements = useGame((s) => s.judgements);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const W = c.clientWidth || 320;
    const H = 200;
    c.width = Math.round(W * dpr);
    c.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const counts = new Array(BUCKETS).fill(0) as number[];
    for (const j of judgements) {
      const ms = j.error * 1000;
      const idx = Math.floor((ms + 300) / 50);
      if (idx >= 0 && idx < BUCKETS) counts[idx] += 1;
    }
    const max = Math.max(1, ...counts);

    ctx.clearRect(0, 0, W, H);
    const bw = W / BUCKETS;
    for (let i = 0; i < BUCKETS; i++) {
      const h = (counts[i] / max) * (H - 24);
      ctx.fillStyle = i === 5 || i === 6 ? "#22c55e" : "#f59e0b";
      ctx.fillRect(i * bw + 2, H - 20 - h, bw - 4, h);
    }
    ctx.fillStyle = "#3f3f46";
    ctx.fillRect(0, H - 20, W, 1);
    ctx.fillStyle = "#a1a1aa";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("-300", bw, H - 6);
    ctx.fillText("0ms", W / 2, H - 6);
    ctx.fillText("+300", W - bw, H - 6);
  }, [judgements]);

  return <canvas ref={ref} className="w-full" style={{ height: 200 }} />;
}
