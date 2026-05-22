import type { ChartSong } from "@/types/note";
import { buildChart } from "@/lib/engine/chart";

export const moonlight: ChartSong = {
  id: "moonlight",
  title: "Moonlight Sonata (1st phrase)",
  bpm: 60,
  difficulty: "hard",
  publicDomain: true,
  notes: buildChart(60, [
    ["G#3", 0.5], ["C#4", 0.5], ["E4", 0.5],
    ["G#3", 0.5], ["C#4", 0.5], ["E4", 0.5],
    ["A3", 0.5], ["C#4", 0.5], ["E4", 0.5],
    ["A3", 0.5], ["C#4", 0.5], ["E4", 0.5],
    ["G#3", 0.5], ["B3", 0.5], ["D#4", 0.5],
    ["G#3", 0.5], ["C4", 0.5], ["D#4", 0.5],
    ["C#4", 0.5], ["E4", 0.5], ["G#4", 0.5],
    ["C#4", 0.5], ["E4", 0.5], ["G#4", 0.5],
  ]),
};
