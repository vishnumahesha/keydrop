import { create } from "zustand";
import type {
  ChartSong,
  InputMode,
  JudgeResult,
  Judgement,
  NoteEvent,
} from "@/types/note";
import { judge, isHittable, hasPassed } from "@/lib/engine/scoring";
import { chartDuration, midiRange } from "@/lib/engine/chart";
import { playNote, stopNote } from "@/lib/audio/synth";

/** Seconds of fall-in before the first note reaches the hit line. */
export const LEAD_IN = 2.5;

/** Nearest C at or below a midi note. */
function octaveFloor(m: number): number {
  return m - (((m % 12) + 12) % 12);
}
/** Nearest C at or above a midi note. */
function octaveCeil(m: number): number {
  const r = ((m % 12) + 12) % 12;
  return r === 0 ? m : m + (12 - r);
}

export type Keyboard = { keyMin: number; keyMax: number; kbBase: number };

/** Derive an octave-aligned keyboard range (>= 1 octave) from a chart. */
export function computeKeyboard(notes: NoteEvent[]): Keyboard {
  if (notes.length === 0) return { keyMin: 60, keyMax: 72, kbBase: 60 };
  const { min, max } = midiRange(notes);
  const keyMin = octaveFloor(min);
  let keyMax = octaveCeil(max);
  if (keyMax - keyMin < 12) keyMax = keyMin + 12;
  const center = octaveFloor(Math.round((min + max) / 2));
  const kbBase = Math.max(keyMin, Math.min(center, keyMax - 12));
  return { keyMin, keyMax, kbBase };
}

export type NoteStatus = {
  status: "pending" | "hit" | "missed";
  result?: JudgeResult;
};

export type AttemptResult = {
  songId: string;
  score: number;
  hits: number;
  attempts: number;
  totalNotes: number;
  maxStreak: number;
  accuracy: number;
  at: number;
};

export type LastJudge = { result: JudgeResult; midi: number; at: number } | null;

type GameState = {
  song: ChartSong | null;
  notes: NoteEvent[];
  noteStates: NoteStatus[];
  duration: number;

  keyMin: number;
  keyMax: number;
  kbBase: number;

  songTime: number;
  started: boolean;
  paused: boolean;
  finished: boolean;

  mode: InputMode;
  waitMode: boolean;

  score: number;
  streak: number;
  maxStreak: number;
  hits: number;
  attempts: number;

  activeKeys: number[];
  lastJudge: LastJudge;
  judgements: Judgement[];
  results: AttemptResult[];

  loadSong: (song: ChartSong) => void;
  setMode: (mode: InputMode) => void;
  setWaitMode: (on: boolean) => void;
  shiftOctave: (dir: -1 | 1) => void;
  start: () => void;
  stop: () => void;
  noteOn: (midi: number, t: number) => void;
  noteOff: (midi: number, t: number) => void;
  tick: (songTime: number) => void;
};

export const useGame = create<GameState>((set, get) => ({
  song: null,
  notes: [],
  noteStates: [],
  duration: 0,

  keyMin: 60,
  keyMax: 72,
  kbBase: 60,

  songTime: 0,
  started: false,
  paused: false,
  finished: false,

  mode: "keyboard",
  waitMode: false,

  score: 0,
  streak: 0,
  maxStreak: 0,
  hits: 0,
  attempts: 0,

  activeKeys: [],
  lastJudge: null,
  judgements: [],
  results: [],

  loadSong: (song) => {
    const notes = song.notes.map((n) => ({ ...n, start: n.start + LEAD_IN }));
    const kb = computeKeyboard(notes);
    set({
      song,
      notes,
      noteStates: notes.map(() => ({ status: "pending" as const })),
      duration: chartDuration(notes),
      keyMin: kb.keyMin,
      keyMax: kb.keyMax,
      kbBase: kb.kbBase,
      songTime: 0,
      started: false,
      paused: false,
      finished: false,
      score: 0,
      streak: 0,
      maxStreak: 0,
      hits: 0,
      attempts: 0,
      activeKeys: [],
      lastJudge: null,
      judgements: [],
    });
  },

  setMode: (mode) => set({ mode }),
  setWaitMode: (on) => set({ waitMode: on }),
  shiftOctave: (dir) => {
    const s = get();
    const next = Math.max(s.keyMin, Math.min(s.kbBase + dir * 12, s.keyMax - 12));
    if (next !== s.kbBase) set({ kbBase: next });
  },

  start: () => {
    const { song } = get();
    if (!song) return;
    set({
      noteStates: song.notes.map(() => ({ status: "pending" as const })),
      songTime: 0,
      started: true,
      paused: false,
      finished: false,
      score: 0,
      streak: 0,
      maxStreak: 0,
      hits: 0,
      attempts: 0,
      activeKeys: [],
      lastJudge: null,
      judgements: [],
    });
  },

  stop: () => set({ started: false, paused: false, activeKeys: [] }),

  noteOn: (midi, t) => {
    const s = get();
    playNote(midi);
    const active = s.activeKeys.includes(midi)
      ? s.activeKeys
      : [...s.activeKeys, midi];

    if (!s.started || s.finished) {
      set({ activeKeys: active });
      return;
    }

    // Find the closest pending note of this pitch within the hit window.
    let bestIdx = -1;
    let bestErr = Infinity;
    let anyNearNote = false;
    for (let i = 0; i < s.notes.length; i++) {
      if (s.noteStates[i].status !== "pending") continue;
      const note = s.notes[i];
      if (isHittable(note.start, t)) {
        anyNearNote = true;
        if (note.midi === midi) {
          const err = Math.abs(note.start - t);
          if (err < bestErr) {
            bestErr = err;
            bestIdx = i;
          }
        }
      }
    }

    if (bestIdx >= 0) {
      const note = s.notes[bestIdx];
      const j = judge(note.start, t);
      const noteStates = s.noteStates.slice();
      noteStates[bestIdx] = { status: "hit", result: j.result };
      const streak = j.result === "miss" ? 0 : s.streak + 1;
      set({
        activeKeys: active,
        noteStates,
        score: s.score + j.points,
        streak,
        maxStreak: Math.max(s.maxStreak, streak),
        hits: s.hits + 1,
        attempts: s.attempts + 1,
        judgements: [...s.judgements, j],
        lastJudge: { result: j.result, midi, at: t },
      });
      return;
    }

    // Wrong note pressed while a hittable note exists -> counts as a miss.
    if (anyNearNote) {
      set({
        activeKeys: active,
        streak: 0,
        attempts: s.attempts + 1,
        lastJudge: { result: "miss", midi, at: t },
      });
      return;
    }

    set({ activeKeys: active });
  },

  noteOff: (midi) => {
    const s = get();
    stopNote(midi);
    if (!s.activeKeys.includes(midi)) return;
    set({ activeKeys: s.activeKeys.filter((m) => m !== midi) });
  },

  tick: (songTime) => {
    const s = get();
    if (!s.started || s.finished) return;

    // Auto-miss notes that have passed the hit window unhit.
    let changed = false;
    let noteStates = s.noteStates;
    let attempts = s.attempts;
    let streak = s.streak;
    for (let i = 0; i < s.notes.length; i++) {
      if (s.noteStates[i].status !== "pending") continue;
      if (hasPassed(s.notes[i], songTime)) {
        if (!changed) noteStates = s.noteStates.slice();
        changed = true;
        noteStates[i] = { status: "missed", result: "miss" };
        attempts += 1;
        streak = 0;
      }
    }

    const finished = songTime > s.duration + LEAD_IN;
    const patch: Partial<GameState> = { songTime };
    if (changed) {
      patch.noteStates = noteStates;
      patch.attempts = attempts;
      patch.streak = streak;
    }
    if (finished) {
      patch.finished = true;
      patch.started = false;
      patch.results = [
        ...s.results,
        {
          songId: s.song?.id ?? "",
          score: s.score,
          hits: s.hits,
          attempts,
          totalNotes: s.notes.length,
          maxStreak: s.maxStreak,
          accuracy: s.notes.length > 0 ? s.hits / s.notes.length : 0,
          at: Date.now(),
        },
      ];
    }
    set(patch);
  },
}));

export function accuracy(s: { hits: number; attempts: number }): number {
  return s.attempts > 0 ? s.hits / s.attempts : 0;
}
