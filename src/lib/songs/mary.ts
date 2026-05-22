import type { ChartSong } from "@/types/note";
import { buildChart } from "@/lib/engine/chart";

export const mary: ChartSong = {
  id: "mary",
  title: "Mary Had a Little Lamb",
  bpm: 110,
  difficulty: "beginner",
  publicDomain: true,
  notes: buildChart(110, [
    ["E4", 1], ["D4", 1], ["C4", 1], ["D4", 1],
    ["E4", 1], ["E4", 1], ["E4", 2],
    ["D4", 1], ["D4", 1], ["D4", 2],
    ["E4", 1], ["G4", 1], ["G4", 2],
    ["E4", 1], ["D4", 1], ["C4", 1], ["D4", 1],
    ["E4", 1], ["E4", 1], ["E4", 1], ["E4", 1],
    ["D4", 1], ["D4", 1], ["E4", 1], ["D4", 1],
    ["C4", 4],
  ]),
};
