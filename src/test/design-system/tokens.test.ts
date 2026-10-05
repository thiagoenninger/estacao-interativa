import { describe, expect, it } from 'vitest';
import { contrastRatio, parseCustomProperties } from '@/test/css';
import colorCss from '@/design-system/tokens/color.css?raw';
import motionCss from '@/design-system/tokens/motion.css?raw';
import spaceShapeCss from '@/design-system/tokens/space-shape.css?raw';

const color = parseCustomProperties(colorCss);
const spaceShape = parseCustomProperties(spaceShapeCss);

const PRIMITIVES: Record<string, string> = {
  '--paper-50': '#f2f3ee',
  '--paper-100': '#e6e7e1',
  '--paper-200': '#d9dbd3',
  '--paper-300': '#b3b7ac',
  '--pencil-500': '#646861',
  '--graphite-700': '#454943',
  '--ink-900': '#1c1e1b',
  '--oxide-500': '#a33a22',
  '--oxide-700': '#7f2c18',
  '--malachite-600': '#2f6b55',
  '--white': '#ffffff',
};

const SEMANTIC_TOKENS = [
  '--color-background-primary',
  '--color-background-secondary',
  '--color-surface',
  '--color-text-primary',
  '--color-text-secondary',
  '--color-text-tertiary',
  '--color-text-accent',
  '--color-text-inverse',
  '--color-orbit-line',
  '--color-orbit-active',
  '--color-divider',
  '--color-divider-strong',
  '--color-border-interactive',
  '--color-border-interactive-secondary',
  '--color-state-active',
  '--color-state-pressed',
  '--color-hotspot-core',
  '--color-hotspot-ring',
  '--color-hotspot-ring-outer',
  '--color-hotspot-halo',
  '--color-feedback-connection',
  '--color-pattern-lattice',
];

/** Resolves var(--x) chains down to a primitive hex. */
function resolveHex(name: string): string {
  const value = color.get(name) ?? '';
  const reference = /^var\((--[a-z0-9-]+)\)$/.exec(value);
  if (reference?.[1]) return resolveHex(reference[1]);
  return value;
}

describe('color tokens (Foundations 01)', () => {
  it('defines the eleven primitives with the Design System values', () => {
    for (const [name, hex] of Object.entries(PRIMITIVES)) expect(color.get(name)).toBe(hex);
  });

  it('defines every semantic token', () => {
    for (const name of SEMANTIC_TOKENS) expect(color.has(name), name).toBe(true);
  });

  it('maps the main semantic tokens to the right primitives', () => {
    expect(resolveHex('--color-background-primary')).toBe(PRIMITIVES['--paper-100']);
    expect(resolveHex('--color-background-secondary')).toBe(PRIMITIVES['--paper-200']);
    expect(resolveHex('--color-surface')).toBe(PRIMITIVES['--paper-50']);
    expect(resolveHex('--color-text-primary')).toBe(PRIMITIVES['--ink-900']);
    expect(resolveHex('--color-state-active')).toBe(PRIMITIVES['--oxide-500']);
    expect(resolveHex('--color-state-pressed')).toBe(PRIMITIVES['--oxide-700']);
    expect(resolveHex('--color-feedback-connection')).toBe(PRIMITIVES['--malachite-600']);
  });

  it('keeps the contrast promised by the Design System on the primary background', () => {
    const background = resolveHex('--color-background-primary');
    // The Design System states the ratios rounded to one decimal place.
    const ratio = (token: string) =>
      Math.round(contrastRatio(resolveHex(token), background) * 10) / 10;
    expect(ratio('--color-text-primary')).toBe(13.5);
    expect(ratio('--color-text-secondary')).toBe(7.4);
    expect(ratio('--color-text-tertiary')).toBe(4.6);
    expect(ratio('--color-text-accent')).toBe(5.3);
    expect(ratio('--color-feedback-connection')).toBe(5);
  });

  it('never leaves a var() pointing to a token that does not exist', () => {
    const everything = new Map([...color, ...spaceShape, ...parseCustomProperties(motionCss)]);
    for (const [name, value] of color) {
      for (const match of value.matchAll(/var\((--[a-z0-9-]+)\)/g)) {
        expect(everything.has(match[1] ?? ''), `${name} uses ${match[1]}`).toBe(true);
      }
    }
  });
});

describe('space, shape and opacity tokens (Foundations 04)', () => {
  it('has the spacing scale, base 8', () => {
    const scale = [0, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 128];
    scale.forEach((pixels, index) => {
      expect(spaceShape.get(`--space-${index}`)).toBe(pixels === 0 ? '0' : `${pixels}px`);
    });
  });

  it('has radius, stroke and icon sizes', () => {
    expect(spaceShape.get('--radius-none')).toBe('0');
    expect(spaceShape.get('--radius-xs')).toBe('2px');
    expect(spaceShape.get('--radius-full')).toBe('9999px');
    expect(spaceShape.get('--stroke-hairline')).toBe('1px');
    expect(spaceShape.get('--stroke-thin')).toBe('1.5px');
    expect(spaceShape.get('--stroke-regular')).toBe('2px');
    expect(spaceShape.get('--stroke-strong')).toBe('3px');
    expect(spaceShape.get('--icon-sm')).toBe('20px');
    expect(spaceShape.get('--icon-md')).toBe('28px');
    expect(spaceShape.get('--icon-lg')).toBe('32px');
  });

  it('has the opacity scale', () => {
    expect(spaceShape.get('--opacity-full')).toBe('1');
    expect(spaceShape.get('--opacity-material-secondary')).toBe('0.5');
    expect(spaceShape.get('--opacity-universe-muted')).toBe('0.2');
    expect(spaceShape.get('--opacity-universe-muted-panel')).toBe('0.15');
    expect(spaceShape.get('--opacity-object-recede')).toBe('0.2');
    expect(spaceShape.get('--opacity-disabled')).toBe('0.4');
    expect(spaceShape.get('--opacity-orbit')).toBe('0.28');
    expect(spaceShape.get('--opacity-lattice')).toBe('0.16');
  });

  it('has the ten depth layers and the touch target', () => {
    for (const level of [0, 10, 20, 30, 40, 50, 60, 70, 80, 90]) {
      expect(spaceShape.get(`--depth-${level}`)).toBe(String(level));
    }
    expect(spaceShape.get('--touch-target-min')).toBe('64px');
    expect(spaceShape.get('--touch-gap-min')).toBe('24px');
  });
});
