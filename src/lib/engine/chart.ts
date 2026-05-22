import type { NoteEvent } from "@/types/note";

const SEMITONES: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

/** "C4" | "F#4" | "Bb3" -> MIDI number (C4 = 60). */
export function noteToMidi(name: string): number {
  const match = /^([A-G][#b]?)(-?\d+)$/.exec(name.trim());
  if (!match) throw new Error(`Invalid note name: "${name}"`);
  const [, pitch, octaveStr] = match;
  const semitone = SEMITONES[pitch];
  if (semitone === undefined) throw new Error(`Unknown pitch: "${pitch}"`);
  return 12 * (Number(octaveStr) + 1) + semitone;
}

const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function midiToNote(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  return `${NAMES[midi % 12]}${octave}`;
}

export function isBlackKey(midi: number): boolean {
  return [1, 3, 6, 8, 10].includes(((midi % 12) + 12) % 12);
}

/** A rest is written as ["R", beats]; a note as ["C4", beats]. */
export type Step = [note: string, beats: number, hand?: "L" | "R"];

/**
 * Build a monophonic chart from sequential shorthand steps.
 * Each step's duration is `beats * (60 / bpm)` seconds, laid end to end.
 * A small gap is left between notes so repeated pitches read as separate hits.
 */
export function buildChart(bpm: number, steps: Step[]): NoteEvent[] {
  const beatSec = 60 / bpm;
  const gap = Math.min(0.04, beatSec * 0.15);
  const notes: NoteEvent[] = [];
  let t = 0;
  for (const [name, beats, hand] of steps) {
    const span = beats * beatSec;
    if (name !== "R") {
      notes.push({
        midi: noteToMidi(name),
        start: t,
        duration: Math.max(0.05, span - gap),
        ...(hand ? { hand } : {}),
      });
    }
    t += span;
  }
  return notes;
}

export function chartDuration(notes: NoteEvent[]): number {
  return notes.reduce((max, n) => Math.max(max, n.start + n.duration), 0);
}

export function midiRange(notes: NoteEvent[]): { min: number; max: number } {
  if (notes.length === 0) return { min: 60, max: 72 };
  let min = Infinity;
  let max = -Infinity;
  for (const n of notes) {
    if (n.midi < min) min = n.midi;
    if (n.midi > max) max = n.midi;
  }
  return { min, max };
}
