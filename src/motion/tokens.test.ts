import { describe, expect, it } from 'vitest';
import { parseCustomProperties } from '../test/css';
import motionCss from '../design-system/tokens/motion.css?raw';
import { DURATION, EASING, IDLE, STAGGER_STEP } from './tokens';

const css = parseCustomProperties(motionCss);
const normalize = (value: string | undefined) => (value ?? '').replace(/\s+/g, '');

describe('motion tokens: CSS and TypeScript say the same thing', () => {
  it.each(Object.entries(DURATION))('duration-%s', (name, milliseconds) => {
    expect(css.get(`--duration-${name}`)).toBe(`${milliseconds}ms`);
  });

  it('stagger-step', () => {
    expect(css.get('--stagger-step')).toBe(`${STAGGER_STEP}ms`);
  });

  it.each(Object.entries(EASING))('easing-%s', (name, curve) => {
    expect(normalize(css.get(`--easing-${name}`))).toBe(normalize(curve));
  });

  it('has no CSS token missing from TypeScript, nor the reverse', () => {
    const cssNames = [...css.keys()].sort();
    const tsNames = [
      ...Object.keys(DURATION).map((name) => `--duration-${name}`),
      '--stagger-step',
      ...Object.keys(EASING).map((name) => `--easing-${name}`),
    ].sort();
    expect(cssNames).toEqual(tsNames);
  });
});

describe('idle rules (JavaScript only)', () => {
  it('follows Foundations 06', () => {
    expect(IDLE.cycleMin).toBe(8000);
    expect(IDLE.cycleMax).toBe(14000);
    expect(IDLE.timeout).toBe(60000);
  });
});
