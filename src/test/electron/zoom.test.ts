import { describe, expect, it } from 'vitest';
import { chooseZoomFactor, computeZoomFactor } from '@electron/zoom.ts';

describe('computeZoomFactor', () => {
  it('is 1 on a Full HD screen', () => {
    expect(computeZoomFactor({ width: 1920, height: 1080 })).toBe(1);
  });

  it('is 2 on a 4K screen with no Windows scale', () => {
    expect(computeZoomFactor({ width: 3840, height: 2160 })).toBe(2);
  });

  it('is 1.333 on a 4K screen at 150% (Windows reports 2560 × 1440)', () => {
    expect(computeZoomFactor({ width: 2560, height: 1440 })).toBeCloseTo(1.3333, 4);
  });

  it('is 1.25 on a 4K screen at 160% and 1.5 at 133%', () => {
    expect(computeZoomFactor({ width: 2400, height: 1350 })).toBe(1.25);
    expect(computeZoomFactor({ width: 2880, height: 1620 })).toBe(1.5);
  });

  it('lets the smaller side win on a screen that is not 16:9', () => {
    // 1920 × 1200 (16:10): the width fits at 1, the Stage keeps its ratio and centers.
    expect(computeZoomFactor({ width: 1920, height: 1200 })).toBe(1);
    // 2560 × 1080 (ultrawide): the height decides.
    expect(computeZoomFactor({ width: 2560, height: 1080 })).toBe(1);
  });

  it('shrinks on a laptop screen smaller than Full HD', () => {
    // The height decides: 768 / 1080.
    expect(computeZoomFactor({ width: 1366, height: 768 })).toBeCloseTo(0.7111, 4);
  });

  it('stays inside the range Chromium accepts', () => {
    expect(computeZoomFactor({ width: 100, height: 100 })).toBe(0.25);
    expect(computeZoomFactor({ width: 30000, height: 20000 })).toBe(5);
  });

  it('falls back to 1 for sizes that are not valid', () => {
    expect(computeZoomFactor({ width: 0, height: 1080 })).toBe(1);
    expect(computeZoomFactor({ width: Number.NaN, height: 1080 })).toBe(1);
    expect(computeZoomFactor({ width: 1920, height: -5 })).toBe(1);
  });
});

describe('chooseZoomFactor', () => {
  it('zooms in kiosk mode and never in an ordinary window', () => {
    expect(chooseZoomFactor(true, { width: 3840, height: 2160 })).toBe(2);
    expect(chooseZoomFactor(false, { width: 3840, height: 2160 })).toBe(1);
  });
});
