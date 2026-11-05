import { describe, expect, it } from 'vitest';
import {
  ANIMATABLE,
  choreographyEnd,
  defineChoreography,
  trackEnd,
  type Track,
} from '@/motion/choreography';
import { SELECT } from './fixtures';

const base: Track = {
  id: 'one',
  target: 'thing',
  at: 0,
  duration: 'base',
  ease: 'standard',
  to: { opacity: 1 },
};

const define = (...overrides: Partial<Track>[]) =>
  defineChoreography(
    'test',
    overrides.map((override, index) => ({ ...base, id: `track-${index}`, ...override })),
  );

describe('what a choreography may animate', () => {
  it('is transform, opacity and the three stroke properties of M02, nothing else', () => {
    expect([...ANIMATABLE]).toEqual([
      'opacity',
      'x',
      'y',
      'scale',
      'scaleX',
      'scaleY',
      'rotation',
      'strokeOpacity',
      'strokeWidth',
      'strokeDashoffset',
    ]);
  });

  it.each(['left', 'top', 'width', 'height', 'backgroundColor', 'filter', 'boxShadow'])(
    'refuses %s, which would repaint or relayout every frame',
    (prop) => {
      expect(() => define({ to: { [prop]: 10 } as never })).toThrow(`animates "${prop}"`);
    },
  );

  it('refuses a value that is not a finite number', () => {
    expect(() => define({ to: { opacity: Number.NaN } })).toThrow('finite number');
    expect(() => define({ to: { opacity: Infinity } })).toThrow('finite number');
    expect(() => define({ to: { opacity: '1' as never } })).toThrow('finite number');
  });
});

describe('defineChoreography', () => {
  it('accepts a well-formed choreography and freezes it', () => {
    expect(Object.isFrozen(SELECT)).toBe(true);
    expect(Object.isFrozen(SELECT.tracks)).toBe(true);
    expect(SELECT.tracks.map((track) => track.id)).toEqual([
      'press',
      'center',
      'recede',
      'spheres',
      'panel',
    ]);
  });

  it('refuses an empty id or no tracks', () => {
    expect(() => defineChoreography(' ', [base])).toThrow('needs an id');
    expect(() => defineChoreography('empty', [])).toThrow('has no tracks');
  });

  it('refuses two tracks with the same id', () => {
    expect(() => defineChoreography('twice', [base, base])).toThrow('two tracks called "one"');
  });

  it('refuses a missing target name', () => {
    expect(() => define({ target: '' })).toThrow('has no target');
  });

  it('refuses a negative or infinite start', () => {
    expect(() => define({ at: -1 })).toThrow('must be 0 or more');
    expect(() => define({ at: Infinity })).toThrow('must be 0 or more');
  });

  it('refuses a duration or easing that is not a token', () => {
    expect(() => define({ duration: 'long' as never })).toThrow('unknown duration');
    expect(() => define({ ease: 'bounce' as never })).toThrow('unknown easing');
  });

  it('refuses nothing to animate', () => {
    expect(() => define({ to: {} })).toThrow('nothing to animate');
  });

  it('refuses a negative stagger', () => {
    expect(() => define({ stagger: -50 })).toThrow('stagger');
  });

  it('refuses a from value that has no to value', () => {
    expect(() => define({ from: { scale: 0.8 }, to: { opacity: 1 } })).toThrow(
      '"scale" in from but not in to',
    );
  });
});

describe('lengths', () => {
  it('a track ends at its start plus its duration', () => {
    expect(trackEnd({ ...base, at: 100, duration: 'slow' })).toBe(800);
  });

  it('a stagger pushes the last element, one step per element after the first', () => {
    expect(trackEnd({ ...base, at: 560, duration: 'base', stagger: 50 }, 5)).toBe(1080);
    expect(trackEnd({ ...base, at: 560, duration: 'base', stagger: 50 }, 1)).toBe(880);
  });

  it('the whole is the end of its last track: the simplified M01 with 5 spheres is 1080 ms', () => {
    expect(choreographyEnd(SELECT, { spheres: 5 })).toBe(1080);
  });

  it('counts one element for a target that is not listed', () => {
    expect(choreographyEnd(SELECT)).toBe(980);
  });
});
