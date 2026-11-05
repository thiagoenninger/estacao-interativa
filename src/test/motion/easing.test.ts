import { describe, expect, it } from 'vitest';
import { cubicBezier, easingFunction, parseCubicBezier } from '@/motion/easing';
import { EASING } from '@/motion/tokens';

function reference(x1: number, y1: number, x2: number, y2: number, progress: number): number {
  const point = (t: number, a: number, b: number) =>
    3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * b + t ** 3;
  let best = 0;
  let bestError = Infinity;
  for (let step = 0; step <= 20000; step += 1) {
    const t = step / 20000;
    const error = Math.abs(point(t, x1, x2) - progress);
    if (error < bestError) {
      bestError = error;
      best = t;
    }
  }
  return point(best, y1, y2);
}

const PROGRESS = [0.05, 0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9, 0.95];

describe('cubicBezier', () => {
  it('starts at 0 and ends at 1, and holds outside the range', () => {
    const curve = cubicBezier(0.4, 0, 0.2, 1);
    expect(curve(0)).toBe(0);
    expect(curve(1)).toBe(1);
    expect(curve(-0.5)).toBe(0);
    expect(curve(1.5)).toBe(1);
  });

  it.each(Object.entries(EASING))('the %s token matches a step-by-step reference', (_name, css) => {
    const numbers = (/cubic-bezier\(([^)]+)\)/.exec(css)?.[1] ?? '').split(',').map(Number);
    const [x1 = 0, y1 = 0, x2 = 0, y2 = 0] = numbers;
    const curve = parseCubicBezier(css);
    for (const progress of PROGRESS) {
      expect(curve(progress)).toBeCloseTo(reference(x1, y1, x2, y2, progress), 3);
    }
  });

  it('is the symmetric ease-in-out of CSS at the middle', () => {
    expect(cubicBezier(0.42, 0, 0.58, 1)(0.5)).toBeCloseTo(0.5, 5);
  });

  it('never goes backwards', () => {
    for (const name of Object.keys(EASING) as (keyof typeof EASING)[]) {
      const curve = easingFunction(name);
      let previous = 0;
      for (let step = 1; step <= 200; step += 1) {
        const value = curve(step / 200);
        expect(value).toBeGreaterThanOrEqual(previous);
        previous = value;
      }
    }
  });

  it('enter starts fast and exit starts slow, against a straight line', () => {
    expect(easingFunction('enter')(0.2)).toBeGreaterThan(0.2);
    expect(easingFunction('exit')(0.2)).toBeLessThan(0.2);
  });

  it('refuses x values outside 0 to 1, which would make time go backwards', () => {
    expect(() => cubicBezier(-0.1, 0, 0.5, 1)).toThrow(RangeError);
    expect(() => cubicBezier(0.5, 0, 1.2, 1)).toThrow(RangeError);
  });
});

describe('parseCubicBezier', () => {
  it('reads the CSS text with any spacing', () => {
    const tight = parseCubicBezier('cubic-bezier(0.4,0,0.2,1)');
    const loose = parseCubicBezier('  cubic-bezier( 0.4 , 0 , 0.2 , 1 )  ');
    expect(tight(0.3)).toBeCloseTo(loose(0.3), 10);
  });

  it('refuses anything else', () => {
    expect(() => parseCubicBezier('ease-in-out')).toThrow('Not a cubic-bezier()');
    expect(() => parseCubicBezier('cubic-bezier(0.4, 0, 0.2)')).toThrow('Not a cubic-bezier()');
  });
});

describe('easingFunction', () => {
  it('gives the same function every time', () => {
    expect(easingFunction('standard')).toBe(easingFunction('standard'));
  });

  it('equals the curve written in the token', () => {
    const direct = parseCubicBezier(EASING.standard);
    for (const progress of PROGRESS) {
      expect(easingFunction('standard')(progress)).toBeCloseTo(direct(progress), 10);
    }
  });
});
