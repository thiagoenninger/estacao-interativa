import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_IDLE_CONFIG,
  IDLE_RETURN_AFTER_MS,
  IDLE_WARN_AFTER_MS,
  createIdleService,
} from '@/experience/idle.ts';
import { createFakeClock } from './fake-clock.ts';

function setup(config = DEFAULT_IDLE_CONFIG) {
  const clock = createFakeClock();
  let away = true;
  const onWarn = vi.fn();
  const onReturn = vi.fn(() => {
    away = false;
  });
  const idle = createIdleService({ clock, config, isAway: () => away, onWarn, onReturn });
  return { clock, idle, onWarn, onReturn, setAway: (value: boolean) => (away = value) };
}

describe('idle service', () => {
  it('uses the times of the Design System: 50 s and 60 s', () => {
    expect(IDLE_WARN_AFTER_MS).toBe(50_000);
    expect(IDLE_RETURN_AFTER_MS).toBe(60_000);
    expect(DEFAULT_IDLE_CONFIG).toEqual({ warnAfterMs: 50_000, returnAfterMs: 60_000 });
  });

  it('is off until the visitor leaves the universe', () => {
    const { idle, clock } = setup();
    expect(idle.snapshot()).toEqual({
      phase: 'off',
      elapsedMs: 0,
      warnInMs: null,
      returnInMs: null,
    });
    expect(clock.pending()).toBe(0);
  });

  it('counts, warns at 50 s and returns at 60 s', () => {
    const { idle, clock, onWarn, onReturn } = setup();
    idle.sync();
    expect(idle.snapshot()).toMatchObject({ phase: 'counting', warnInMs: 50_000 });

    clock.advance(49_999);
    expect(onWarn).not.toHaveBeenCalled();
    expect(idle.snapshot()).toMatchObject({ phase: 'counting', warnInMs: 1, returnInMs: 10_001 });

    clock.advance(1);
    expect(onWarn).toHaveBeenCalledTimes(1);
    expect(idle.snapshot()).toMatchObject({
      phase: 'warning',
      elapsedMs: 50_000,
      warnInMs: null,
      returnInMs: 10_000,
    });

    clock.advance(9_999);
    expect(onReturn).not.toHaveBeenCalled();
    clock.advance(1);
    expect(onReturn).toHaveBeenCalledTimes(1);
    expect(idle.snapshot().phase).toBe('off');
    expect(clock.pending()).toBe(0);
  });

  it('a touch restarts the count from zero', () => {
    const { idle, clock, onWarn } = setup();
    idle.sync();
    clock.advance(40_000);
    idle.restart();
    clock.advance(49_999);
    expect(onWarn).not.toHaveBeenCalled();
    clock.advance(1);
    expect(onWarn).toHaveBeenCalledTimes(1);
  });

  it('a touch during the warning goes back to counting and cancels the return', () => {
    const { idle, clock, onWarn, onReturn } = setup();
    idle.sync();
    clock.advance(55_000);
    expect(idle.snapshot().phase).toBe('warning');
    idle.restart();
    expect(idle.snapshot()).toMatchObject({ phase: 'counting', elapsedMs: 0 });
    clock.advance(59_999);
    expect(onReturn).not.toHaveBeenCalled();
    expect(onWarn).toHaveBeenCalledTimes(2);
  });

  it('sync does not restart a count that is already running', () => {
    const { idle, clock } = setup();
    idle.sync();
    clock.advance(20_000);
    idle.sync();
    expect(idle.snapshot().elapsedMs).toBe(20_000);
  });

  it('turns off when the visitor is back in the universe', () => {
    const { idle, clock, setAway } = setup();
    idle.sync();
    setAway(false);
    idle.sync();
    expect(idle.snapshot().phase).toBe('off');
    expect(clock.pending()).toBe(0);
  });

  it('a touch in the universe does not start the count', () => {
    const { idle, clock, setAway } = setup();
    setAway(false);
    idle.restart();
    expect(idle.snapshot().phase).toBe('off');
    expect(clock.pending()).toBe(0);
  });

  it('stop cancels the timers and can be used again', () => {
    const { idle, clock, onWarn } = setup();
    idle.sync();
    idle.stop();
    clock.advance(100_000);
    expect(onWarn).not.toHaveBeenCalled();
    idle.restart();
    clock.advance(50_000);
    expect(onWarn).toHaveBeenCalledTimes(1);
  });

  it('accepts other times', () => {
    const { idle, clock, onWarn, onReturn } = setup({ warnAfterMs: 500, returnAfterMs: 800 });
    idle.sync();
    clock.advance(500);
    expect(onWarn).toHaveBeenCalledTimes(1);
    clock.advance(300);
    expect(onReturn).toHaveBeenCalledTimes(1);
  });

  it.each([
    { warnAfterMs: 0, returnAfterMs: 10 },
    { warnAfterMs: 10, returnAfterMs: 10 },
    { warnAfterMs: 20, returnAfterMs: 10 },
  ])('refuses the times %j', (config) => {
    expect(() =>
      createIdleService({
        clock: createFakeClock(),
        config,
        isAway: () => true,
        onWarn: () => {},
        onReturn: () => {},
      }),
    ).toThrow(RangeError);
  });
});
