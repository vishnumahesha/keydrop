"use client";

/**
 * Salamander Grand piano via Tone.Sampler. Tone is loaded lazily (dynamic
 * import) so importing this module stays cheap and SSR/test-safe. Audio only
 * starts after a real user gesture calls `ensureAudio()`.
 */

// Every-minor-third sample map; Tone pitch-shifts the gaps.
const SALAMANDER_BASE = "https://tonejs.github.io/audio/salamander/";
const SAMPLES: Record<string, string> = {
  A1: "A1.mp3", C2: "C2.mp3", "D#2": "Ds2.mp3", "F#2": "Fs2.mp3",
  A2: "A2.mp3", C3: "C3.mp3", "D#3": "Ds3.mp3", "F#3": "Fs3.mp3",
  A3: "A3.mp3", C4: "C4.mp3", "D#4": "Ds4.mp3", "F#4": "Fs4.mp3",
  A4: "A4.mp3", C5: "C5.mp3", "D#5": "Ds5.mp3", "F#5": "Fs5.mp3",
  A5: "A5.mp3", C6: "C6.mp3", "D#6": "Ds6.mp3", "F#6": "Fs6.mp3",
  A6: "A6.mp3", C7: "C7.mp3",
};

let Tone: typeof import("tone") | null = null;
let sampler: import("tone").Sampler | null = null;
let loaded = false;
let initPromise: Promise<void> | null = null;

/** Resume the audio context and load samples. Idempotent; call on a user gesture. */
export function ensureAudio(): Promise<void> {
  if (initPromise) return initPromise;
  if (typeof window === "undefined" || typeof AudioContext === "undefined") {
    // No real WebAudio (SSR / jsdom tests) — stay a silent no-op.
    initPromise = Promise.resolve();
    return initPromise;
  }
  initPromise = (async () => {
    const mod = await import("tone");
    Tone = mod;
    await mod.start(); // unlock the AudioContext (fast)
    sampler = new mod.Sampler({
      urls: SAMPLES,
      baseUrl: SALAMANDER_BASE,
      release: 1,
      volume: -6,
    }).toDestination();
    await mod.loaded(); // wait for samples (slower)
    loaded = true;
  })();
  return initPromise;
}

export function isAudioReady(): boolean {
  return loaded;
}

function noteName(midi: number): string {
  return Tone!.Frequency(midi, "midi").toNote();
}

export function playNote(midi: number, velocity = 0.8): void {
  if (!loaded || !sampler || !Tone) {
    void ensureAudio(); // boot on first press; this one stays silent
    return;
  }
  sampler.triggerAttack(noteName(midi), undefined, velocity);
}

export function stopNote(midi: number): void {
  if (!loaded || !sampler || !Tone) return;
  sampler.triggerRelease(noteName(midi));
}
