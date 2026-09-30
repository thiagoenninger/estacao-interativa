import { describe, expect, it } from 'vitest';
import { parseCustomProperties, parseRules } from '../test/css';
import typographyCss from './tokens/typography.css?raw';

const rules = parseRules(typographyCss);

/** The twelve styles of Foundations 02: [class, font shorthand, letter-spacing, uppercase]. */
const STYLES = [
  ['type-display', '700 96px/100px var(--font-sans)', '-0.03em', false],
  ['type-heading-1', '400 56px/64px var(--font-sans)', '-0.015em', false],
  ['type-heading-2', '500 40px/48px var(--font-sans)', '-0.01em', false],
  ['type-heading-3', '600 28px/36px var(--font-sans)', '0', false],
  ['type-material-name', '300 72px/76px var(--font-sans)', '-0.02em', false],
  ['type-object-name', '500 18px/24px var(--font-mono)', '0.14em', true],
  ['type-body-large', '400 28px/40px var(--font-sans)', '0', false],
  ['type-body', '400 24px/36px var(--font-sans)', '0', false],
  ['type-overline', '500 16px/24px var(--font-mono)', '0.12em', true],
  ['type-data', '400 18px/24px var(--font-mono)', '0.04em', false],
  ['type-caption', '400 18px/26px var(--font-sans)', '0', false],
  ['type-interactive-label', '600 20px/24px var(--font-condensed)', '0.08em', true],
] as const;

describe('typography (Foundations 02)', () => {
  it('has exactly twelve type styles', () => {
    const classes = [...rules.keys()].filter((selector) => selector.startsWith('.type-'));
    expect(classes).toHaveLength(12);
  });

  it.each(STYLES)('%s follows the Design System table', (name, font, tracking, uppercase) => {
    const declarations = rules.get(`.${name}`);
    expect(declarations?.get('font')).toBe(font);
    expect(declarations?.get('letter-spacing')).toBe(tracking);
    expect(declarations?.get('text-transform')).toBe(uppercase ? 'uppercase' : undefined);
  });

  it('never goes below 16 px', () => {
    for (const [, font] of STYLES) {
      const size = Number(/(\d+)px\//.exec(font)?.[1]);
      expect(size).toBeGreaterThanOrEqual(16);
    }
  });

  it('declares the three families with local fallbacks only', () => {
    const properties = parseCustomProperties(typographyCss);
    expect(properties.get('--font-sans')).toContain("'IBM Plex Sans'");
    expect(properties.get('--font-condensed')).toContain("'IBM Plex Sans Condensed'");
    expect(properties.get('--font-mono')).toContain("'IBM Plex Mono'");
  });
});
