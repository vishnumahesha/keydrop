import type { ChartSong } from "@/types/note";
import { buildChart } from "@/lib/engine/chart";

export const amazing: ChartSong = {
  id: "amazing",
  title: "Amazing Grace",
  bpm: 90,
  difficulty: "easy",
  publicDomain: true,
  notes: buildChart(90, [
    ["G3", 1],
    ["C4", 2], ["E4", 1], ["C4", 1], ["E4", 2], ["D4", 1],
    ["C4", 2], ["A3", 1], ["G3", 2], ["G3", 1],
    ["C4", 2], ["E4", 1], ["C4", 1], ["E4", 2], ["D4", 1],
    ["G4", 3], ["E4", 1],
    ["G4", 2], ["E4", 1], ["G4", 2], ["D4", 1],
    ["C4", 3],
  ]),
};
