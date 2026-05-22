@AGENTS.md

# KeyDrop — Piano Practice PWA

## Product
Falling-tile piano game + practice coach. User picks a song, picks an input mode (laptop keys / phone touch / MIDI keyboard / acoustic piano mic), notes fall toward a piano layout, and the app scores timing + accuracy + hold length.

## Actual stack (as scaffolded)
- Next.js 16 (App Router), React 19, TypeScript strict, Tailwind v4 (CSS-first, no tailwind.config), mobile-first
- IMPORTANT: this is Next 16 — dynamic-route `params` is a Promise. See AGENTS.md.
- Audio: Tone.js with Sampler + Salamander Grand piano samples (CDN) — Phase 2
- MIDI parsing: @tonejs/midi
- MIDI input: Web MIDI API
- Mic pitch detection: autocorrelation V1, Basic Pitch WASM V2 (Phase 8)
- State: Zustand
- Persistence: localStorage now, Supabase later (Phase 5)
- Deploy: Vercel, PWA via next-pwa
- Game loop: Canvas2D + requestAnimationFrame, decoupled songTime clock
- No copyrighted songs. Public-domain only at launch + user MIDI upload.

## File structure
```
src/
  app/
    page.tsx                 # home: song select + mode select
    game/[songId]/page.tsx   # gameplay
    layout.tsx
  components/
    Piano.tsx                # piano keyboard render + input
    FallingNotes.tsx         # canvas falling tiles
    HUD.tsx                  # score, streak, accuracy
  lib/
    engine/
      clock.ts               # songTime, pause/resume, wait gate, sole performance.now() owner
      scoring.ts             # pure judge() + points
      chart.ts               # buildChart shorthand -> NoteEvent[]
    input/
      keyboard.ts            # window.keydown -> noteOn/noteOff hook
    songs/
      *.ts                   # public-domain charts
      index.ts               # registry
  store/
    game.ts                  # Zustand game state
  types/
    note.ts                  # NoteEvent, ChartSong, JudgeResult
```

## Core types
```ts
export type NoteEvent = {
  midi: number;        // 21..108
  start: number;       // seconds
  duration: number;    // seconds
  hand?: 'L' | 'R';
  finger?: 1|2|3|4|5;
};
export type ChartSong = {
  id: string;
  title: string;
  bpm: number;
  difficulty: 'beginner'|'easy'|'medium'|'hard';
  publicDomain: true;
  notes: NoteEvent[];
};
export type JudgeResult = 'perfect'|'great'|'good'|'miss';
```

## Scoring (locked)
- Timing windows from hit: perfect ±50ms · great ±100ms · good ±180ms · miss >250ms
- Points: 100 / 60 / 30 / 0
- Final = 50% notes hit + 30% timing avg + 15% hold accuracy + 5% streak bonus

## Quality bar
- TS strict, no `any`. Generics + discriminated unions.
- All audio/input modules route through a shared `noteOn(midi, t)` / `noteOff(midi, t)` store interface.
- Game loop never reads `performance.now()` outside `clock.ts`.
- Latency: <200ms input -> visual feedback.
- Mobile: iOS Safari + Android Chrome. Touch keys ≥44px tall.
- Lighthouse PWA score ≥90.
- No copyrighted assets.

## Definition of done per phase
`npm run build` clean, manual smoke test passing, conventional commit, tag (v0.1, v0.2, ...).
