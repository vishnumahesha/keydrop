import type { HandFilter, NoteEvent, NoteStatus } from "@/types/note";

/** Index of the next note still awaiting judgement, or -1 if none. */
export function nextPendingIndex(noteStates: NoteStatus[]): number {
  return noteStates.findIndex((s) => s.status === "pending");
}

/**
 * Wait-mode gate: freeze once the next pending note has reached the hit line
 * (songTime >= its start) so the player can take their time.
 */
export function shouldFreeze(
  notes: NoteEvent[],
  noteStates: NoteStatus[],
  songTime: number,
): boolean {
  const i = nextPendingIndex(noteStates);
  if (i < 0) return false;
  return notes[i].start <= songTime;
}

/** Filter notes by hand. No-op when "both" or the chart lacks hand markers. */
export function filterByHand(notes: NoteEvent[], filter: HandFilter): NoteEvent[] {
  if (filter === "both") return notes;
  if (!notes.some((n) => n.hand)) return notes;
  const want = filter === "right" ? "R" : "L";
  return notes.filter((n) => n.hand === want);
}

/** Whether any note in a set carries hand metadata. */
export function chartHasHands(notes: NoteEvent[]): boolean {
  return notes.some((n) => n.hand);
}

export type WeakSection = {
  start: number;
  end: number;
  accuracy: number;
  count: number;
};

/**
 * Bucket notes into fixed time windows and return the weakest ones.
 * Only buckets with >= 2 notes qualify; sorted by ascending accuracy.
 */
export function weakSections(
  notes: NoteEvent[],
  noteStates: NoteStatus[],
  bucketSec = 4,
  limit = 3,
): WeakSection[] {
  const buckets = new Map<number, { hits: number; count: number }>();
  for (let i = 0; i < notes.length; i++) {
    const b = Math.floor(notes[i].start / bucketSec);
    const entry = buckets.get(b) ?? { hits: 0, count: 0 };
    entry.count += 1;
    if (noteStates[i]?.status === "hit") entry.hits += 1;
    buckets.set(b, entry);
  }
  const sections: WeakSection[] = [];
  for (const [b, { hits, count }] of buckets) {
    if (count < 2) continue;
    sections.push({
      start: b * bucketSec,
      end: (b + 1) * bucketSec,
      accuracy: hits / count,
      count,
    });
  }
  sections.sort((a, z) => a.accuracy - z.accuracy || a.start - z.start);
  return sections.slice(0, limit);
}

/** Reset notes whose start falls within [start, end] back to pending (loop wrap). */
export function resetStatesInRange(
  noteStates: NoteStatus[],
  notes: NoteEvent[],
  start: number,
  end: number,
): NoteStatus[] {
  return noteStates.map((s, i) =>
    notes[i].start >= start && notes[i].start <= end
      ? { status: "pending" as const }
      : s,
  );
}
