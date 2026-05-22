import { describe, it, expect } from "vitest";
import { autocorrelate, frequencyToMidi, octaveFoldMatch } from "@/lib/input/mic";

describe("frequencyToMidi", () => {
  it("maps standard frequencies", () => {
    expect(frequencyToMidi(440)).toBe(69); // A4
    expect(frequencyToMidi(261.63)).toBe(60); // C4
    expect(frequencyToMidi(523.25)).toBe(72); // C5
  });
});

describe("octaveFoldMatch", () => {
  it("matches the same pitch class across octaves", () => {
    expect(octaveFoldMatch(72, 60)).toBe(true); // C5 plays for C4
    expect(octaveFoldMatch(48, 60)).toBe(true);
    expect(octaveFoldMatch(60, 60)).toBe(true);
  });
  it("rejects different pitch classes", () => {
    expect(octaveFoldMatch(67, 60)).toBe(false); // G vs C
    expect(octaveFoldMatch(61, 60)).toBe(false);
  });
});

describe("autocorrelate", () => {
  it("detects the pitch of a synthetic sine wave", () => {
    const sampleRate = 44100;
    const freq = 440;
    const buf = new Float32Array(2048);
    for (let i = 0; i < buf.length; i++) {
      buf[i] = Math.sin((2 * Math.PI * freq * i) / sampleRate);
    }
    const detected = autocorrelate(buf, sampleRate);
    expect(detected).toBeGreaterThan(430);
    expect(detected).toBeLessThan(450);
  });

  it("returns -1 for near-silence", () => {
    const buf = new Float32Array(2048); // all zeros
    expect(autocorrelate(buf, 44100)).toBe(-1);
  });
});
