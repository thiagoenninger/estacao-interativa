import { describe, expect, it } from 'vitest';
import * as motion from '@/motion';

describe('what src/motion offers to the rest of the app', () => {
  it('exports exactly the planned names, so nothing leaks and nothing goes missing', () => {
    expect(Object.keys(motion).sort()).toEqual(
      [
        'ANIMATABLE',
        'DRIFT_AMPLITUDE',
        'DRIFT_PERIOD_FACTOR',
        'DURATION',
        'EASING',
        'FADED_AMPLITUDE',
        'FLOAT_AMPLITUDE',
        'FLOAT_BLEND_TAU',
        'IDLE',
        'ROTATION_AMPLITUDE',
        'ROTATION_PERIOD_FACTOR',
        'SELECTED_AMPLITUDE',
        'STAGGER_STEP',
        'choreographyEnd',
        'createFloatModel',
        'createMotionChannel',
        'createRandom',
        'cubicBezier',
        'defineChoreography',
        'drawFloatParams',
        'easingFunction',
        'parseCubicBezier',
        'startFloat',
        'trackEnd',
        'useFloat',
        'useMotionChannel',
      ].sort(),
    );
  });

  it('is the same token table that the CSS mirror test checks', async () => {
    const tokens = await import('@/motion/tokens');
    expect(motion.DURATION).toBe(tokens.DURATION);
    expect(motion.EASING).toBe(tokens.EASING);
    expect(motion.STAGGER_STEP).toBe(tokens.STAGGER_STEP);
    expect(motion.IDLE).toBe(tokens.IDLE);
  });
});
