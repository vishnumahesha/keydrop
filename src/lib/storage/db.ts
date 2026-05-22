import { get, set } from "idb-keyval";
import type { ChartSong } from "@/types/note";

const IMPORTED_KEY = "keydrop.imported";
const SCORES_KEY = "keydrop.scores";

export async function listImported(): Promise<ChartSong[]> {
  return (await get<ChartSong[]>(IMPORTED_KEY)) ?? [];
}

export async function addImported(song: ChartSong): Promise<void> {
  const all = await listImported();
  await set(IMPORTED_KEY, [...all.filter((s) => s.id !== song.id), song]);
}

export async function removeImported(id: string): Promise<void> {
  const all = await listImported();
  await set(
    IMPORTED_KEY,
    all.filter((s) => s.id !== id),
  );
}

export async function getScores(): Promise<Record<string, number>> {
  return (await get<Record<string, number>>(SCORES_KEY)) ?? {};
}

/** Record a score, keeping only the best per chart. */
export async function recordScore(chartId: string, score: number): Promise<void> {
  const scores = await getScores();
  if (score > (scores[chartId] ?? 0)) {
    scores[chartId] = score;
    await set(SCORES_KEY, scores);
  }
}
