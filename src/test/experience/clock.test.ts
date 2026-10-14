import { afterEach, describe, expect, it, vi } from 'vitest';
import { createScaledClock, createSystemClock } from '@/experience/clock.ts';
import { createFakeClock } from './fake-clock.ts';

describe('scaled clock', () => {
  it('at speed 1 behaves like its base', () => {
    const base = createFakeClock();
    const clock = createScaledClock(base);
    const fn = vi.fn();
    clock.setTimeout(fn, 1000);
    base.advance(999);
    expect(fn).not.toHaveBeenCalled();
    base.advance(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(clock.now()).toBe(1000);
  });

  it('at speed 20, 60 s pass in 3 s', () => {
    const base = createFakeClock();
    const clock = createScaledClock(base, 20);
    const fn = vi.fn();
    clock.setTimeout(fn, 60_000);
    base.advance(2999);
    expect(fn).not.toHaveBeenCalled();
    base.advance(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(clock.now()).toBe(60_000);
  });

  it('changing the speed does not make the time jump and reschedules the timers', () => {
    const base = createFakeClock();
    const clock = createScaledClock(base, 1);
    const fn = vi.fn();
    clock.setTimeout(fn, 10_000);
    base.advance(2000);
    expect(clock.now()).toBe(2000);

    clock.setSpeed(4);
    expect(clock.getSpeed()).toBe(4);
    expect(clock.now()).toBe(2000);
    base.advance(1999);
    expect(fn).not.toHaveBeenCalled();
    base.advance(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(clock.now()).toBe(10_000);
  });

  it('can slow down again', () => {
    const base = createFakeClock();
    const clock = createScaledClock(base, 10);
    const fn = vi.fn();
    clock.setTimeout(fn, 10_000);
    base.advance(500);
    expect(clock.now()).toBe(5000);
    clock.setSpeed(1);
    base.advance(4999);
    expect(fn).not.toHaveBeenCalled();
    base.advance(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('a cleared timer never fires, before or after a speed change', () => {
    const base = createFakeClock();
    const clock = createScaledClock(base, 2);
    const fn = vi.fn();
    const id = clock.setTimeout(fn, 1000);
    clock.clearTimeout(id);
    clock.setSpeed(5);
    base.advance(10_000);
    expect(fn).not.toHaveBeenCalled();
    expect(base.pending()).toBe(0);
  });

  it('forgets a timer once it has fired', () => {
    const base = createFakeClock();
    const clock = createScaledClock(base);
    clock.setTimeout(() => {}, 10);
    base.advance(10);
    clock.setSpeed(3);
    expect(base.pending()).toBe(0);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('refuses the speed %s', (speed) => {
    expect(() => createScaledClock(createFakeClock(), speed)).toThrow(RangeError);
    const clock = createScaledClock(createFakeClock());
    expect(() => clock.setSpeed(speed)).toThrow(RangeError);
  });
});

describe('system clock', () => {
  afterEach(() => vi.useRealTimers());

  it('runs and cancels timers', () => {
    vi.useFakeTimers();
    const clock = createSystemClock();
    const fired = vi.fn();
    const cancelled = vi.fn();
    clock.setTimeout(fired, 100);
    clock.clearTimeout(clock.setTimeout(cancelled, 100));
    vi.advanceTimersByTime(100);
    expect(fired).toHaveBeenCalledTimes(1);
    expect(cancelled).not.toHaveBeenCalled();
  });

  it('now() moves forward', () => {
    const clock = createSystemClock();
    const first = clock.now();
    expect(clock.now()).toBeGreaterThanOrEqual(first);
  });
});
