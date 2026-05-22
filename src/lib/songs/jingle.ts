import type { ChartSong } from "@/types/note";
import { buildChart } from "@/lib/engine/chart";

export const jingle: ChartSong = {
  id: "jingle",
  title: "Jingle Bells",
  bpm: 120,
  difficulty: "easy",
  publicDomain: true,
  notes: buildChart(120, [
    ["E4", 1], ["E4", 1], ["E4", 2],
    ["E4", 1], ["E4", 1], ["E4", 2],
    ["E4", 1], ["G4", 1], ["C4", 1], ["D4", 1], ["E4", 4],
    ["F4", 1], ["F4", 1], ["F4", 1], ["F4", 1],
    ["F4", 1], ["E4", 1], ["E4", 1], ["E4", 0.5], ["E4", 0.5],
    ["E4", 1], ["D4", 1], ["D4", 1], ["E4", 1],
    ["D4", 2], ["G4", 2],
  ]),
};
