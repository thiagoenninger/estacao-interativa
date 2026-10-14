import { describe, expect, it } from 'vitest';
import { EMPTY_TOUCH_LOG, summarizeTouch, trackTouch, type TouchLog } from '@/dev/spike/touch-log';
import { createTouchGate } from '@/interaction';

/** A small random number generator with a seed, so a failure can be repeated. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const FINGERS = [1, 2, 3, 4];

describe('the gate follows the same rule that the spike measured', () => {
  it('accepts and ignores the same touches in 2,000 random sequences of 60 events', () => {
    for (let seed = 1; seed <= 2000; seed += 1) {
      const random = seeded(seed);
      const gate = createTouchGate();
      let log: TouchLog = EMPTY_TOUCH_LOG;
      const down = new Set<number>();
      let time = 0;

      for (let step = 0; step < 60; step += 1) {
        const id = FINGERS[Math.floor(random() * FINGERS.length)] ?? 1;
        time += 10;
        const sample = { id, type: 'touch', x: 0, y: 0, time };
        if (down.has(id)) {
          const kind = random() < 0.5 ? 'up' : 'cancel';
          down.delete(id);
          gate.pointerUp(id);
          log = trackTouch(log, { kind, sample });
        } else {
          down.add(id);
          gate.pointerDown({ id, type: 'touch', isPrimary: false });
          log = trackTouch(log, { kind: 'down', sample });
        }

        const snapshot = gate.snapshot();
        const summary = summarizeTouch(log);
        const message = `seed ${seed}, step ${step}`;
        expect(snapshot.primaryId, message).toBe(log.primaryId);
        expect(snapshot.accepted, message).toBe(summary.accepted);
        expect(snapshot.busy, message).toBe(summary.ignored);
        // Never more than one pointer counts.
        expect(
          FINGERS.filter((finger) => gate.isPrimary(finger)).length,
          message,
        ).toBeLessThanOrEqual(1);
      }
    }
  }, 15_000);
});
