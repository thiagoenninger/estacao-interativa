import { describe, expect, it } from 'vitest';
import { createRandom } from '@/motion/random';

describe('createRandom', () => {
  it('repeats the same sequence for the same seed', () => {
    const a = createRandom(42);
    const b = createRandom(42);
    expect(Array.from({ length: 20 }, a)).toEqual(Array.from({ length: 20 }, b));
  });

  it('gives other sequences for other seeds', () => {
    expect(createRandom(1)()).not.toBe(createRandom(2)());
  });

  it('stays from 0 up to 1, never reaching 1, and spreads over the range', () => {
    const random = createRandom(7);
    const values = Array.from({ length: 5000 }, random);
    expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...values)).toBeLessThan(1);
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    expect(mean).toBeGreaterThan(0.45);
    expect(mean).toBeLessThan(0.55);
  });
});
