import type { Clock, TimerId } from '@/experience/clock.ts';

export interface FakeClock extends Clock {
  advance(ms: number): void;
  pending(): number;
}

export function createFakeClock(): FakeClock {
  let time = 0;
  let nextId = 1;
  const timers = new Map<TimerId, { due: number; callback: () => void }>();

  return {
    now: () => time,
    setTimeout(callback, delayMs) {
      const id = nextId++;
      timers.set(id, { due: time + delayMs, callback });
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
    pending: () => timers.size,
    advance(ms) {
      const target = time + ms;
      for (;;) {
        let nextId: TimerId | null = null;
        let nextDue = Infinity;
        for (const [id, timer] of timers) {
          if (timer.due <= target && timer.due < nextDue) {
            nextId = id;
            nextDue = timer.due;
          }
        }
        if (nextId === null) break;
        const timer = timers.get(nextId)!;
        timers.delete(nextId);
        time = timer.due;
        timer.callback();
      }
      time = target;
    },
  };
}
