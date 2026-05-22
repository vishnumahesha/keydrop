"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGame } from "@/store/game";

// ---- pure DSP helpers (unit-tested) ----

/** Autocorrelation pitch detector. Returns frequency in Hz, or -1 if unclear. */
export function autocorrelate(buf: Float32Array, sampleRate: number): number {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1;

  let r1 = 0;
  let r2 = SIZE - 1;
  const thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < thres) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < thres) {
      r2 = SIZE - i;
      break;
    }
  }
  const b = buf.slice(r1, r2);
  const n = b.length;
  const c = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i; j++) c[i] += b[j] * b[j + i];
  }
  let d = 0;
  while (d < n - 1 && c[d] > c[d + 1]) d++;
  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < n; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }
  if (maxpos <= 0) return -1;
  let t0 = maxpos;
  const x1 = c[t0 - 1] ?? 0;
  const x2 = c[t0] ?? 0;
  const x3 = c[t0 + 1] ?? 0;
  const a = (x1 + x3 - 2 * x2) / 2;
  const bb = (x3 - x1) / 2;
  if (a) t0 = t0 - bb / (2 * a);
  return sampleRate / t0;
}

export function frequencyToMidi(freq: number): number {
  return Math.round(69 + 12 * Math.log2(freq / 440));
}

/** True when two notes share a pitch class (octave-folded). */
export function octaveFoldMatch(detectedMidi: number, expectedMidi: number): boolean {
  return ((((detectedMidi - expectedMidi) % 12) + 12) % 12) === 0;
}

// ---- React hook (browser only) ----

export type MicStatus = {
  supported: boolean;
  listening: boolean;
  calibrating: boolean;
  detectedMidi: number | null;
  enable: () => void;
};

const MATCH_WINDOW = 0.3; // seconds around a note's start
const REFRACTORY = 0.12; // min seconds between mic-triggered notes

export function useMicInput(enabled: boolean): MicStatus {
  const [supported] = useState(
    () => typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia,
  );
  const [listening, setListening] = useState(false);
  const [calibrating, setCalibrating] = useState(false);
  const [detectedMidi, setDetectedMidi] = useState<number | null>(null);

  const stream = useRef<MediaStream | null>(null);
  const ctx = useRef<AudioContext | null>(null);
  const raf = useRef(0);
  const gate = useRef(0.02);
  const lastFire = useRef(0);

  const teardown = useCallback(() => {
    cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    void ctx.current?.close();
    stream.current = null;
    ctx.current = null;
  }, []);

  const enable = useCallback(async () => {
    if (!supported || listening) return;
    const media = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    stream.current = media;
    const audio = new AudioContext();
    ctx.current = audio;
    const source = audio.createMediaStreamSource(media);
    const analyser = audio.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    const buf = new Float32Array(analyser.fftSize);

    // Calibrate the room noise floor for ~1.5s, then set a gate above it.
    setCalibrating(true);
    let peak = 0;
    const calStart = performance.now();
    const calibrate = () => {
      analyser.getFloatTimeDomainData(buf);
      let rms = 0;
      for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
      rms = Math.sqrt(rms / buf.length);
      peak = Math.max(peak, rms);
      if (performance.now() - calStart < 1500) {
        raf.current = requestAnimationFrame(calibrate);
      } else {
        gate.current = Math.max(0.02, peak * 2);
        setCalibrating(false);
        setListening(true);
        raf.current = requestAnimationFrame(detect);
      }
    };

    const detect = () => {
      analyser.getFloatTimeDomainData(buf);
      let rms = 0;
      for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
      rms = Math.sqrt(rms / buf.length);
      if (rms > gate.current) {
        const freq = autocorrelate(buf, audio.sampleRate);
        if (freq > 0) {
          const midi = frequencyToMidi(freq);
          setDetectedMidi(midi);
          const s = useGame.getState();
          const i = s.noteStates.findIndex((st) => st.status === "pending");
          if (i >= 0 && Math.abs(s.notes[i].start - s.songTime) <= MATCH_WINDOW) {
            const now = s.songTime;
            if (octaveFoldMatch(midi, s.notes[i].midi) && now - lastFire.current > REFRACTORY) {
              s.noteOn(s.notes[i].midi, now);
              lastFire.current = now;
            }
          }
        }
      }
      raf.current = requestAnimationFrame(detect);
    };

    raf.current = requestAnimationFrame(calibrate);
  }, [supported, listening]);

  useEffect(() => {
    if (!enabled) teardown();
    return () => teardown();
  }, [enabled, teardown]);

  return { supported, listening, calibrating, detectedMidi, enable };
}
