/**
 * The single owner of `performance.now()` and `requestAnimationFrame`.
 * Nothing else in the app should read wall-clock time directly.
 *
 * songTime advances in seconds, scaled by `speed`. When frozen (wait mode),
 * songTime holds steady but wall time keeps tracking so resume never jumps.
 */
export type TickFn = (songTime: number, dt: number) => void;

export class Clock {
  private _songTime = 0;
  private speed = 1;
  private running = false;
  private frozen = false;
  private lastWall = 0;
  private rafId = 0;
  private readonly onTick: TickFn;

  constructor(onTick: TickFn) {
    this.onTick = onTick;
  }

  get songTime(): number {
    return this._songTime;
  }

  get isRunning(): boolean {
    return this.running;
  }

  get isFrozen(): boolean {
    return this.frozen;
  }

  setSpeed(multiplier: number): void {
    this.speed = Math.max(0.1, multiplier);
  }

  start(): void {
    if (this.running) return;
    this._songTime = 0;
    this.frozen = false;
    this.running = true;
    this.lastWall = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  }

  /** Pause the rAF loop entirely (e.g. user pause). */
  pause(): void {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  resume(): void {
    if (this.running) return;
    this.running = true;
    this.lastWall = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  }

  /** Stop and reset to zero. */
  stop(): void {
    this.pause();
    this._songTime = 0;
    this.frozen = false;
  }

  /** Jump songTime to an absolute value (loop wraparound) without a wall jump. */
  setTime(t: number): void {
    this._songTime = t;
    this.lastWall = performance.now();
  }

  /** Wait-mode gate: hold songTime while keeping the loop alive. */
  freeze(): void {
    this.frozen = true;
  }

  unfreeze(): void {
    this.frozen = false;
  }

  private readonly loop = (now: number): void => {
    if (!this.running) return;
    const wallDt = (now - this.lastWall) / 1000;
    this.lastWall = now;
    const dt = this.frozen ? 0 : wallDt * this.speed;
    this._songTime += dt;
    this.onTick(this._songTime, dt);
    this.rafId = requestAnimationFrame(this.loop);
  };
}
