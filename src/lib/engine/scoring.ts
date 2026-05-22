import type { JudgeResult, Judgement, NoteEvent } from "@/types/note";

/** Timing windows in seconds, measured as |pressTime - note.start|. */
export const TIMING_WINDOWS = {
  perfect: 0.05,
  great: 0.1,
  good: 0.18,
  /** Beyond this a note can no longer be hit and auto-misses. */
  miss: 0.25,
} as const;

export const POINTS: Record<JudgeResult, number> = {
  perfect: 100,
  great: 60,
  good: 30,
  miss: 0,
};

/** Pure timing judge. `error` is signed (pressTime - noteStart). */
export function judge(noteStart: number, pressTime: number): Judgement {
  const error = pressTime - noteStart;
  const abs = Math.abs(error);
  let result: JudgeResult;
  if (abs <= TIMING_WINDOWS.perfect) result = "perfect";
  else if (abs <= TIMING_WINDOWS.great) result = "great";
  else if (abs <= TIMING_WINDOWS.good) result = "good";
  else result = "miss";
  return { result, points: POINTS[result], error };
}

/** Whether a press at `pressTime` is close enough to register against a note. */
export function isHittable(noteStart: number, pressTime: number): boolean {
  return Math.abs(pressTime - noteStart) <= TIMING_WINDOWS.good;
}

/** A note has irrecoverably passed (auto-miss) once now exceeds this. */
export function hasPassed(note: NoteEvent, now: number): boolean {
  return now > note.start + TIMING_WINDOWS.miss;
}

export type FinalBreakdown = {
  /** 0..100 weighted final score */
  final: number;
  noteHitPct: number; // 0..1
  timingPct: number; // 0..1
  holdPct: number; // 0..1
  streakPct: number; // 0..1
};

/**
 * Final score (locked formula): 50% notes hit + 30% timing avg + 15% hold + 5% streak.
 * timingAvgError in seconds; holdAccuracy and streakBonus already normalized 0..1.
 */
export function computeFinal(args: {
  hits: number;
  totalNotes: number;
  timingAvgError: number;
  holdAccuracy: number;
  streakBonus: number;
}): FinalBreakdown {
  const noteHitPct = args.totalNotes > 0 ? args.hits / args.totalNotes : 0;
  // Map avg timing error onto 0..1 (perfect at 0ms, zero at the good window edge).
  const timingPct = clamp01(1 - args.timingAvgError / TIMING_WINDOWS.good);
  const holdPct = clamp01(args.holdAccuracy);
  const streakPct = clamp01(args.streakBonus);
  const final =
    100 * (0.5 * noteHitPct + 0.3 * timingPct + 0.15 * holdPct + 0.05 * streakPct);
  return { final, noteHitPct, timingPct, holdPct, streakPct };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
