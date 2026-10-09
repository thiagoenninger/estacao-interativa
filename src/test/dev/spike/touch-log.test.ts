import { describe, expect, it } from 'vitest';
import {
  EMPTY_TOUCH_LOG,
  summarizeTouch,
  trackTouch,
  type PointerSample,
  type TouchEvent,
} from '@/dev/spike/touch-log';

const sample = (id: number, x: number, y: number, time: number, type = 'touch'): PointerSample => ({
  id,
  type,
  x,
  y,
  time,
});

function play(events: TouchEvent[]) {
  return events.reduce(trackTouch, EMPTY_TOUCH_LOG);
}

describe('trackTouch', () => {
  it('accepts the first touch and follows it to the end', () => {
    const log = play([
      { kind: 'down', sample: sample(1, 10, 10, 0) },
      { kind: 'move', sample: sample(1, 13, 14, 50) },
      { kind: 'up', sample: sample(1, 13, 14, 120) },
    ]);
    expect(log.accepted).toBe(1);
    expect(log.ignored).toBe(0);
    expect(log.primaryId).toBeNull();
    expect(log.active).toEqual({});
    expect(log.finished).toEqual([{ durationMs: 120, travelPx: 5 }]);
  });

  it('a second finger is ignored while the first is down (Flows 02, C10)', () => {
    const log = play([
      { kind: 'down', sample: sample(1, 10, 10, 0) },
      { kind: 'down', sample: sample(2, 200, 50, 20) },
    ]);
    expect(log.accepted).toBe(1);
    expect(log.ignored).toBe(1);
    expect(log.primaryId).toBe(1);
    expect(log.maxSimultaneous).toBe(2);
  });

  it('the second finger does not count when it lifts, nor does it move the first', () => {
    const log = play([
      { kind: 'down', sample: sample(1, 10, 10, 0) },
      { kind: 'down', sample: sample(2, 200, 50, 20) },
      { kind: 'move', sample: sample(2, 400, 400, 40) },
      { kind: 'up', sample: sample(2, 400, 400, 60) },
    ]);
    expect(log.finished).toEqual([]);
    expect(log.currentTravelPx).toBe(0);
    expect(log.primaryId).toBe(1);
    expect(Object.keys(log.active)).toEqual(['1']);
  });

  it('after the first finger lifts, the next touch is accepted again', () => {
    const log = play([
      { kind: 'down', sample: sample(1, 0, 0, 0) },
      { kind: 'up', sample: sample(1, 0, 0, 100) },
      { kind: 'down', sample: sample(2, 5, 5, 300) },
    ]);
    expect(log.accepted).toBe(2);
    expect(log.ignored).toBe(0);
    expect(log.primaryId).toBe(2);
  });

  it('a cancelled touch also ends', () => {
    const log = play([
      { kind: 'down', sample: sample(1, 0, 0, 0) },
      { kind: 'cancel', sample: sample(1, 0, 0, 30) },
    ]);
    expect(log.primaryId).toBeNull();
    expect(log.finished).toHaveLength(1);
  });

  it('keeps the farthest point the finger reached, not where it ended', () => {
    const log = play([
      { kind: 'down', sample: sample(1, 0, 0, 0) },
      { kind: 'move', sample: sample(1, 30, 40, 20) },
      { kind: 'move', sample: sample(1, 3, 4, 40) },
      { kind: 'up', sample: sample(1, 3, 4, 60) },
    ]);
    expect(log.finished[0]?.travelPx).toBe(50);
  });

  it('ignores moves and ups of a pointer that never went down', () => {
    const log = play([
      { kind: 'move', sample: sample(9, 1, 1, 0) },
      { kind: 'up', sample: sample(9, 1, 1, 10) },
    ]);
    expect(log).toEqual(EMPTY_TOUCH_LOG);
  });

  it('remembers the pointer types it has seen, once each', () => {
    const log = play([
      { kind: 'down', sample: sample(1, 0, 0, 0, 'touch') },
      { kind: 'up', sample: sample(1, 0, 0, 90, 'touch') },
      { kind: 'down', sample: sample(2, 0, 0, 200, 'mouse') },
      { kind: 'up', sample: sample(2, 0, 0, 290, 'mouse') },
      { kind: 'down', sample: sample(3, 0, 0, 400, 'touch') },
    ]);
    expect(log.types).toEqual(['touch', 'mouse']);
  });

  it('keeps only the last 200 finished touches', () => {
    let log = EMPTY_TOUCH_LOG;
    for (let i = 0; i < 230; i++) {
      log = trackTouch(log, { kind: 'down', sample: sample(1, 0, 0, i * 100) });
      log = trackTouch(log, { kind: 'up', sample: sample(1, 0, 0, i * 100 + 80) });
    }
    expect(log.accepted).toBe(230);
    expect(log.finished).toHaveLength(200);
  });
});

describe('summarizeTouch', () => {
  it('an empty log has nothing to average', () => {
    expect(summarizeTouch(EMPTY_TOUCH_LOG)).toEqual({
      accepted: 0,
      ignored: 0,
      maxSimultaneous: 0,
      types: [],
      touches: 0,
      averageDurationMs: 0,
      veryShort: 0,
      maxTravelPx: 0,
    });
  });

  it('counts the very short touches (under 40 ms) and the largest drift', () => {
    const log = play([
      { kind: 'down', sample: sample(1, 0, 0, 0) },
      { kind: 'up', sample: sample(1, 0, 0, 20) },
      { kind: 'down', sample: sample(2, 0, 0, 100) },
      { kind: 'move', sample: sample(2, 6, 8, 150) },
      { kind: 'up', sample: sample(2, 6, 8, 200) },
    ]);
    const summary = summarizeTouch(log);
    expect(summary.touches).toBe(2);
    expect(summary.veryShort).toBe(1);
    expect(summary.averageDurationMs).toBe(60);
    expect(summary.maxTravelPx).toBe(10);
  });
});
