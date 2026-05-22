import type { ChartSong } from "@/types/note";
import { buildChart } from "@/lib/engine/chart";

export const furelise: ChartSong = {
  id: "furelise",
  title: "Für Elise (opening)",
  bpm: 80,
  difficulty: "medium",
  publicDomain: true,
  notes: buildChart(80, [
    ["E5", 0.5], ["D#5", 0.5], ["E5", 0.5], ["D#5", 0.5], ["E5", 0.5], ["B4", 0.5], ["D5", 0.5], ["C5", 0.5],
    ["A4", 1], ["R", 0.5], ["C4", 0.5], ["E4", 0.5], ["A4", 0.5],
    ["B4", 1], ["R", 0.5], ["E4", 0.5], ["G#4", 0.5], ["B4", 0.5],
    ["C5", 1], ["R", 0.5], ["E5", 0.5], ["D#5", 0.5],
    ["E5", 0.5], ["D#5", 0.5], ["E5", 0.5], ["B4", 0.5], ["D5", 0.5], ["C5", 0.5],
    ["A4", 2],
  ]),
};
