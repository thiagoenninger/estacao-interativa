import { EASING } from './tokens.ts';

export type EasingFunction = (progress: number) => number;

export type EasingName = keyof typeof EASING;

const NEWTON_STEPS = 8;
const BISECTION_STEPS = 40;
const PRECISION = 1e-7;

export function cubicBezier(x1: number, y1: number, x2: number, y2: number): EasingFunction {
  if (!(x1 >= 0 && x1 <= 1 && x2 >= 0 && x2 <= 1)) {
    throw new RangeError(`cubic-bezier x values must be between 0 and 1 (got ${x1} and ${x2})`);
  }

  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  const sampleX = (t: number): number => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number): number => ((ay * t + by) * t + cy) * t;
  const slopeX = (t: number): number => (3 * ax * t + 2 * bx) * t + cx;

  return (progress) => {
    if (progress <= 0) return 0;
    if (progress >= 1) return 1;

    let t = progress;
    for (let step = 0; step < NEWTON_STEPS; step += 1) {
      const error = sampleX(t) - progress;
      if (Math.abs(error) < PRECISION) return sampleY(t);
      const slope = slopeX(t);
      if (Math.abs(slope) < 1e-6) break;
      t -= error / slope;
    }

    let low = 0;
    let high = 1;
    t = progress;
    for (let step = 0; step < BISECTION_STEPS; step += 1) {
      const error = sampleX(t) - progress;
      if (Math.abs(error) < PRECISION) break;
      if (error < 0) low = t;
      else high = t;
      t = (low + high) / 2;
    }
    return sampleY(t);
  };
}

const BEZIER = /^cubic-bezier\(\s*([\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*([\d.]+)\s*,\s*(-?[\d.]+)\s*\)$/;

export function parseCubicBezier(css: string): EasingFunction {
  const match = BEZIER.exec(css.trim());
  if (match === null) throw new Error(`Not a cubic-bezier(): "${css}"`);
  const [x1, y1, x2, y2] = match.slice(1).map(Number);
  return cubicBezier(x1 ?? 0, y1 ?? 0, x2 ?? 0, y2 ?? 0);
}

const cache = new Map<EasingName, EasingFunction>();

export function easingFunction(name: EasingName): EasingFunction {
  let curve = cache.get(name);
  if (curve === undefined) {
    curve = parseCubicBezier(EASING[name]);
    cache.set(name, curve);
  }
  return curve;
}
