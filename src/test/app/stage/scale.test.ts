import { describe, expect, it } from 'vitest';
import { calculateScale } from '@/app/stage/scale';

describe('calculateScale', () => {
  it('Full HD: factor 1 and no offset', () => {
    expect(calculateScale(1920, 1080)).toEqual({ factor: 1, offsetX: 0, offsetY: 0 });
  });

  it('4K: factor 2 and no offset', () => {
    expect(calculateScale(3840, 2160)).toEqual({ factor: 2, offsetX: 0, offsetY: 0 });
  });

  it('smaller 16:9 window: scales down proportionally', () => {
    const { factor, offsetX, offsetY } = calculateScale(1280, 720);
    expect(factor).toBeCloseTo(2 / 3, 10);
    expect(offsetX).toBeCloseTo(0, 10);
    expect(offsetY).toBeCloseTo(0, 10);
  });

  it('window wider than 16:9: height rules and side bands remain', () => {
    const { factor, offsetX, offsetY } = calculateScale(2560, 1080);
    expect(factor).toBe(1);
    expect(offsetX).toBe(320);
    expect(offsetY).toBe(0);
  });

  it('window taller than 16:9: width rules and top and bottom bands remain', () => {
    const { factor, offsetX, offsetY } = calculateScale(1920, 1200);
    expect(factor).toBe(1);
    expect(offsetX).toBe(0);
    expect(offsetY).toBe(60);
  });

  it('portrait window: fits by width', () => {
    const { factor, offsetX } = calculateScale(1080, 1920);
    expect(factor).toBeCloseTo(0.5625, 10);
    expect(offsetX).toBeCloseTo(0, 10);
  });

  it('invalid size: keeps the logical size', () => {
    expect(calculateScale(0, 0)).toEqual({ factor: 1, offsetX: 0, offsetY: 0 });
    expect(calculateScale(-10, 500)).toEqual({ factor: 1, offsetX: 0, offsetY: 0 });
    expect(calculateScale(Number.NaN, 500)).toEqual({ factor: 1, offsetX: 0, offsetY: 0 });
  });
});
