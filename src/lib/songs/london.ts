import type { ChartSong } from "@/types/note";
import { buildChart } from "@/lib/engine/chart";

export const london: ChartSong = {
  id: "london",
  title: "London Bridge",
  bpm: 120,
  difficulty: "easy",
  publicDomain: true,
  notes: buildChart(120, [
    ["G4", 1], ["A4", 1], ["G4", 1], ["F4", 1], ["E4", 1], ["F4", 1], ["G4", 2],
    ["D4", 1], ["E4", 1], ["F4", 2],
    ["E4", 1], ["F4", 1], ["G4", 2],
    ["G4", 1], ["A4", 1], ["G4", 1], ["F4", 1], ["E4", 1], ["F4", 1], ["G4", 2],
    ["D4", 2], ["G4", 1], ["E4", 1], ["C4", 2],
  ]),
};
