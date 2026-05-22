import type { ChartSong } from "@/types/note";
import { buildChart } from "@/lib/engine/chart";

export const greensleeves: ChartSong = {
  id: "greensleeves",
  title: "Greensleeves",
  bpm: 90,
  difficulty: "medium",
  publicDomain: true,
  notes: buildChart(90, [
    ["A4", 2],
    ["C5", 1], ["D5", 1], ["E5", 1.5], ["F5", 0.5], ["E5", 1],
    ["D5", 2], ["B4", 1], ["G4", 1], ["A4", 1.5], ["B4", 0.5], ["C5", 1],
    ["A4", 2], ["A4", 1], ["G#4", 1], ["A4", 1.5], ["B4", 0.5], ["G#4", 1],
    ["E4", 3],
  ]),
};
