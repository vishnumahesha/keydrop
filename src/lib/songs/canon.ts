import type { ChartSong } from "@/types/note";
import { buildChart } from "@/lib/engine/chart";

export const canon: ChartSong = {
  id: "canon",
  title: "Canon in D",
  bpm: 100,
  difficulty: "medium",
  publicDomain: true,
  notes: buildChart(100, [
    ["F#5", 1], ["E5", 1], ["D5", 1], ["C#5", 1],
    ["B4", 1], ["A4", 1], ["B4", 1], ["C#5", 1],
    ["D5", 1], ["C#5", 1], ["B4", 1], ["A4", 1],
    ["G4", 1], ["F#4", 1], ["G4", 1], ["E4", 1],
    ["D4", 2], ["A4", 2], ["F#4", 2], ["D4", 2],
  ]),
};
