import type { ChartSong } from "@/types/note";
import { buildChart } from "@/lib/engine/chart";

export const ode: ChartSong = {
  id: "ode",
  title: "Ode to Joy",
  bpm: 120,
  difficulty: "easy",
  publicDomain: true,
  notes: buildChart(120, [
    ["E4", 1], ["E4", 1], ["F4", 1], ["G4", 1],
    ["G4", 1], ["F4", 1], ["E4", 1], ["D4", 1],
    ["C4", 1], ["C4", 1], ["D4", 1], ["E4", 1],
    ["E4", 1.5], ["D4", 0.5], ["D4", 2],
    ["E4", 1], ["E4", 1], ["F4", 1], ["G4", 1],
    ["G4", 1], ["F4", 1], ["E4", 1], ["D4", 1],
    ["C4", 1], ["C4", 1], ["D4", 1], ["E4", 1],
    ["D4", 1.5], ["C4", 0.5], ["C4", 2],
  ]),
};
