import { describe, expect, it } from 'vitest';
import { TOUCH } from '@/design-system/measures';
import {
  loadComparedTo4k,
  logicalPxToMm,
  panelSize,
  REFERENCE_PANEL,
  stagePhysicalSize,
  touchTargetsMm,
} from '@/dev/spike/physical-size';

describe('panelSize', () => {
  it('a 43-inch 16:9 screen is about 952 × 535 mm', () => {
    const size = panelSize(43);
    expect(size.widthMm).toBeCloseTo(951.9, 0);
    expect(size.heightMm).toBeCloseTo(535.4, 0);
  });

  it('the diagonal of the sides is the diagonal of the screen', () => {
    const size = panelSize(55);
    expect(Math.hypot(size.widthMm, size.heightMm)).toBeCloseTo(55 * 25.4, 6);
  });

  it('one logical pixel is about 0.5 mm on 43 inches and 0.63 mm on 55 inches', () => {
    expect(panelSize(43).mmPerLogicalPx).toBeCloseTo(0.496, 3);
    expect(panelSize(55).mmPerLogicalPx).toBeCloseTo(0.634, 3);
  });
});

describe('touch targets in millimeters', () => {
  it('the Design System says 64 px are 40 mm on 55 inches', () => {
    expect(logicalPxToMm(64, 55)).toBeCloseTo(40.6, 1);
  });

  it('on 43 inches the minimum target is about 32 mm', () => {
    const targets = touchTargetsMm(43);
    expect(targets.minimum).toBeCloseTo(31.7, 1);
    expect(targets.recommended).toBeCloseTo(39.7, 1);
    expect(targets.material).toBeCloseTo(55.5, 1);
    expect(targets.gap).toBeCloseTo(11.9, 1);
    expect(targets.minimum).toBeCloseTo(logicalPxToMm(TOUCH.minTarget, 43), 6);
  });
});

describe('loadComparedTo4k', () => {
  it('the 4K panel is 1 and Full HD is a quarter', () => {
    expect(loadComparedTo4k(REFERENCE_PANEL.width, REFERENCE_PANEL.height)).toBe(1);
    expect(loadComparedTo4k(1920, 1080)).toBe(0.25);
  });

  it('the Stage on the 2560 × 1600 desk screen (2560 × 1440 of it) is 44% of the 4K panel', () => {
    expect(loadComparedTo4k(2560, 1440)).toBeCloseTo(0.444, 3);
  });
});

describe('stagePhysicalSize', () => {
  it('is the Stage times the scale times the pixel ratio', () => {
    expect(stagePhysicalSize(1, 1)).toEqual({ width: 1920, height: 1080 });
    expect(stagePhysicalSize(4 / 3, 1.5)).toEqual({ width: 3840, height: 2160 });
  });

  it('a maximized window on a 2560 × 1600 screen at 150% paints 2560 × 1440 of it', () => {
    expect(stagePhysicalSize(2560 / 1.5 / 1920, 1.5)).toEqual({ width: 2560, height: 1440 });
  });
});
