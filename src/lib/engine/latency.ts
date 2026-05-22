/**
 * Latency calibration math. Given the signed timing errors (ms) of taps
 * against a metronome, compute the mean offset after dropping outliers
 * beyond 2 standard deviations. A positive result means the player taps
 * late, i.e. their input lags by that many milliseconds.
 */
export function computeLatencyOffset(errorsMs: number[]): number {
  if (errorsMs.length === 0) return 0;
  const mean = average(errorsMs);
  const variance = average(errorsMs.map((e) => (e - mean) ** 2));
  const sd = Math.sqrt(variance);
  const kept = sd > 0 ? errorsMs.filter((e) => Math.abs(e - mean) <= 2 * sd) : errorsMs;
  return kept.length > 0 ? Math.round(average(kept)) : Math.round(mean);
}

/** Signed error (ms) of a tap against the nearest metronome beat. */
export function tapError(elapsedMs: number, beatMs: number): number {
  const beat = Math.round(elapsedMs / beatMs);
  return elapsedMs - beat * beatMs;
}

function average(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
