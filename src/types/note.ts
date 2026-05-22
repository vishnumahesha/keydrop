export type Hand = "L" | "R";
export type Finger = 1 | 2 | 3 | 4 | 5;

export type NoteEvent = {
  midi: number; // 21..108
  start: number; // seconds
  duration: number; // seconds
  hand?: Hand;
  finger?: Finger;
};

export type Difficulty = "beginner" | "easy" | "medium" | "hard";

export type ChartSong = {
  id: string;
  title: string;
  bpm: number;
  difficulty: Difficulty;
  publicDomain: true;
  notes: NoteEvent[];
};

export type JudgeResult = "perfect" | "great" | "good" | "miss";

export type NoteStatus = {
  status: "pending" | "hit" | "missed";
  result?: JudgeResult;
};

export type HandFilter = "both" | "left" | "right";

export type InputMode = "keyboard" | "touch" | "midi" | "mic";

export type Judgement = {
  result: JudgeResult;
  points: number;
  /** signed timing error in seconds: pressTime - note.start (negative = early) */
  error: number;
};
