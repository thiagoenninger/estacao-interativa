import { describe, expect, it } from 'vitest';
import { summarizeTaps, tapOffset, TARGET_SIZES } from '@/dev/spike/target-taps';

describe('tapOffset', () => {
  const rect = { left: 100, top: 200, width: 64, height: 64 };

  it('a tap in the center has no offset and is inside', () => {
    expect(tapOffset({ x: 132, y: 232 }, rect, 64)).toEqual({ dx: 0, dy: 0, inside: true });
  });

  it('measures the offset in px of the Stage when the Stage is scaled', () => {
    // Stage at half scale: the 64 px square measures 32 px on the screen, center at x 116.
    const scaled = { left: 100, top: 200, width: 32, height: 32 };
    const tap = tapOffset({ x: 120, y: 216 }, scaled, 64);
    expect(tap.dx).toBe(4 * 2);
    expect(tap.dy).toBe(0);
  });

  it('the edge is inside and a pixel past it is outside', () => {
    expect(tapOffset({ x: 164, y: 232 }, rect, 64).inside).toBe(true);
    expect(tapOffset({ x: 165, y: 232 }, rect, 64).inside).toBe(false);
  });

  it('with no layout (a test, an element not drawn) the scale is 1', () => {
    const none = { left: 0, top: 0, width: 0, height: 0 };
    expect(tapOffset({ x: 10, y: -4 }, none, 64)).toEqual({ dx: 10, dy: -4, inside: true });
  });
});

describe('summarizeTaps', () => {
  it('has the five sizes, including the 64 and 80 px of the Design System', () => {
    expect(TARGET_SIZES).toEqual([32, 48, 64, 80, 112]);
  });

  it('turns the distance into millimeters on the screen in use', () => {
    // 43 inches: 1 px is 0.496 mm. A 3-4-5 triangle: 10 px from the center.
    const summary = summarizeTaps([{ dx: 6, dy: 8, inside: true }], 43);
    expect(summary.meanErrorMm).toBeCloseTo(4.96, 2);
    expect(summary.maxErrorMm).toBeCloseTo(4.96, 2);
  });

  it('counts the hits and keeps the largest error', () => {
    const summary = summarizeTaps(
      [
        { dx: 0, dy: 0, inside: true },
        { dx: 30, dy: 0, inside: true },
        { dx: 50, dy: 0, inside: false },
      ],
      43,
    );
    expect(summary.taps).toBe(3);
    expect(summary.hits).toBe(2);
    expect(summary.maxErrorMm).toBeCloseTo(24.8, 1);
    expect(summary.meanErrorMm).toBeCloseTo((0 + 14.88 + 24.8) / 3, 1);
  });

  it('no taps, no numbers', () => {
    expect(summarizeTaps([], 43)).toEqual({ taps: 0, hits: 0, meanErrorMm: 0, maxErrorMm: 0 });
  });
});
