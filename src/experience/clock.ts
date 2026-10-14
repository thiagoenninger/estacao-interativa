export type TimerId = number;

/**
 * The time the idle service sees. Production uses the system clock; tests use a fake one that
 * moves only when told; the debug tab uses a scaled one to watch 60 s pass in 3 s.
 */
export interface Clock {
  /** Milliseconds since an arbitrary start. Only differences matter. */
  now(): number;
  setTimeout(callback: () => void, delayMs: number): TimerId;
  clearTimeout(id: TimerId): void;
}

export function createSystemClock(): Clock {
  return {
    now: () => performance.now(),
    setTimeout: (callback, delayMs) => window.setTimeout(callback, delayMs),
    clearTimeout: (id) => window.clearTimeout(id),
  };
}

export interface ScaledClock extends Clock {
  getSpeed(): number;
  /** Changes the speed without any jump in `now()`; timers already set are rescheduled. */
  setSpeed(speed: number): void;
}

interface Pending {
  due: number;
  callback: () => void;
  handle: TimerId;
}

/**
 * A clock that runs `speed` times faster than `base`. Delays and `now()` are in the fast
 * ("virtual") time: with speed 20, `setTimeout(fn, 60_000)` fires after 3 real seconds.
 */
export function createScaledClock(base: Clock, initialSpeed = 1): ScaledClock {
  assertSpeed(initialSpeed);
  let speed = initialSpeed;
  let anchorBase = base.now();
  let anchorVirtual = 0;
  let nextId = 1;
  const pending = new Map<TimerId, Pending>();

  const now = (): number => anchorVirtual + (base.now() - anchorBase) * speed;

  function arm(id: TimerId, timer: Pending): void {
    const remaining = Math.max(0, timer.due - now());
    timer.handle = base.setTimeout(() => {
      pending.delete(id);
      timer.callback();
    }, remaining / speed);
  }

  return {
    now,
    setTimeout(callback, delayMs) {
      const id = nextId++;
      const timer: Pending = { due: now() + Math.max(0, delayMs), callback, handle: 0 };
      pending.set(id, timer);
      arm(id, timer);
      return id;
    },
    clearTimeout(id) {
      const timer = pending.get(id);
      if (!timer) return;
      base.clearTimeout(timer.handle);
      pending.delete(id);
    },
    getSpeed: () => speed,
    setSpeed(next) {
      assertSpeed(next);
      anchorVirtual = now();
      anchorBase = base.now();
      speed = next;
      for (const [id, timer] of pending) {
        base.clearTimeout(timer.handle);
        arm(id, timer);
      }
    },
  };
}

function assertSpeed(speed: number): void {
  if (!Number.isFinite(speed) || speed <= 0) {
    throw new RangeError(`Clock speed must be a positive number (received ${speed}).`);
  }
}
