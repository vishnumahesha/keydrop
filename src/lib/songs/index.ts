import type { ChartSong } from "@/types/note";
import { twinkle } from "./twinkle";
import { mary } from "./mary";
import { ode } from "./ode";
import { row } from "./row";
import { london } from "./london";

export const SONGS: ChartSong[] = [twinkle, mary, ode, row, london];

export const SONG_MAP: Record<string, ChartSong> = Object.fromEntries(
  SONGS.map((s) => [s.id, s]),
);

export const DEFAULT_SONG_ID = "twinkle";

export function getSong(id: string): ChartSong {
  return SONG_MAP[id] ?? twinkle;
}
