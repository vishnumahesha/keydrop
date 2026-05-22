import { Midi } from "@tonejs/midi";
import type { ChartSong, Difficulty, Hand, NoteEvent } from "@/types/note";

/** Snap a time to the nearest grid step (e.g. a 1/32 note). */
export function quantize(time: number, step: number): number {
  if (step <= 0) return time;
  return Math.round(time / step) * step;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Assign hands by splitting at the median pitch (>= median => right). */
export function splitHandsByPitch<T extends { midi: number }>(notes: T[]): Hand[] {
  const med = median(notes.map((n) => n.midi));
  return notes.map((n) => (n.midi >= med ? "R" : "L"));
}

/** Heuristic difficulty from note density. */
export function inferDifficulty(noteCount: number, durationSec: number): Difficulty {
  const nps = noteCount / Math.max(1, durationSec);
  if (nps < 1.5) return "beginner";
  if (nps < 3) return "easy";
  if (nps < 5) return "medium";
  return "hard";
}

type Raw = { midi: number; time: number; duration: number; track: number };

/** Parse a .mid ArrayBuffer into a ChartSong (quantized, hand-split). */
export function midiToChart(buffer: ArrayBuffer, fallbackName: string): ChartSong {
  const midi = new Midi(buffer);
  const bpm = Math.round(midi.header.tempos[0]?.bpm ?? 120);
  const step = 60 / bpm / 8; // a 1/32 note in seconds

  const raw: Raw[] = [];
  midi.tracks.forEach((track, ti) => {
    track.notes.forEach((n) => {
      raw.push({ midi: n.midi, time: n.time, duration: n.duration, track: ti });
    });
  });
  if (raw.length === 0) throw new Error("No notes in MIDI file");
  raw.sort((a, b) => a.time - b.time);

  const t0 = raw[0].time;
  const trackCount = new Set(raw.map((r) => r.track)).size;

  let hands: Hand[];
  if (trackCount >= 2) {
    // Track with the higher average pitch is the right hand.
    const avg = new Map<number, { sum: number; n: number }>();
    for (const r of raw) {
      const e = avg.get(r.track) ?? { sum: 0, n: 0 };
      e.sum += r.midi;
      e.n += 1;
      avg.set(r.track, e);
    }
    const trackAvg = new Map<number, number>();
    avg.forEach((v, k) => trackAvg.set(k, v.sum / v.n));
    const overall = median([...trackAvg.values()]);
    hands = raw.map((r) => ((trackAvg.get(r.track) ?? 0) >= overall ? "R" : "L"));
  } else {
    hands = splitHandsByPitch(raw);
  }

  const notes: NoteEvent[] = raw.map((r, i) => ({
    midi: r.midi,
    start: quantize(r.time - t0, step),
    duration: Math.max(step, quantize(r.duration, step)),
    hand: hands[i],
  }));

  const duration = notes.reduce((m, n) => Math.max(m, n.start + n.duration), 0);
  const title = midi.name?.trim() || fallbackName || "Imported song";

  return {
    id: `import-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    bpm,
    difficulty: inferDifficulty(notes.length, duration),
    publicDomain: true,
    notes,
  };
}
