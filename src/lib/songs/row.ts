import type { ChartSong } from "@/types/note";
import { buildChart } from "@/lib/engine/chart";

export const row: ChartSong = {
  id: "row",
  title: "Row, Row, Row Your Boat",
  bpm: 110,
  difficulty: "easy",
  publicDomain: true,
  notes: buildChart(110, [
    ["C4", 1], ["C4", 1], ["C4", 1], ["D4", 1], ["E4", 2],
    ["E4", 1], ["D4", 1], ["E4", 1], ["F4", 1], ["G4", 2],
    ["C5", 0.5], ["C5", 0.5], ["C5", 0.5], ["G4", 0.5],
    ["G4", 0.5], ["G4", 0.5], ["E4", 0.5], ["E4", 0.5],
    ["E4", 0.5], ["E4", 0.5], ["C4", 0.5], ["C4", 0.5],
    ["G4", 1], ["F4", 1], ["E4", 1], ["D4", 1], ["C4", 2],
  ]),
};
