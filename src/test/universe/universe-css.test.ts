import { describe, expect, it } from 'vitest';
import colorCss from '@/design-system/tokens/color.css?raw';
import motionCss from '@/design-system/tokens/motion.css?raw';
import spaceShapeCss from '@/design-system/tokens/space-shape.css?raw';
import typographyCss from '@/design-system/tokens/typography.css?raw';
import universeCss from '@/universe/universe.css?raw';
import { parseCustomProperties, parseRules } from '@/test/css';

const rules = parseRules(universeCss);
const tokens = new Map([
  ...parseCustomProperties(colorCss),
  ...parseCustomProperties(motionCss),
  ...parseCustomProperties(spaceShapeCss),
  ...parseCustomProperties(typographyCss),
]);
const own = parseCustomProperties(universeCss);
const rule = (selector: string) => rules.get(selector);

describe('universe.css: objects', () => {
  it('presses to 0.96 in 80 ms (Components 01 · Floating Object)', () => {
    expect(
      rule(".universe-object[data-pressed='true'] .universe-object__body")?.get('transform'),
    ).toBe('scale(0.96)');
    expect(rule('.universe-object__body')?.get('transition')).toBe(
      'transform var(--duration-instant) var(--easing-standard)',
    );
    expect(tokens.get('--duration-instant')).toBe('80ms');
  });

  it('turns the label to the pressed color with a 2 px underline', () => {
    const pressed = rule(".universe-object[data-pressed='true'] .universe-object__label");
    expect(pressed?.get('color')).toBe('var(--color-state-pressed)');
    expect(pressed?.get('text-decoration-color')).toBe('var(--color-state-pressed)');
    expect(rule('.universe-object__label')?.get('text-decoration-thickness')).toBe(
      'var(--stroke-regular)',
    );
    expect(tokens.get('--stroke-regular')).toBe('2px');
  });

  it('puts the label 16 px under the base of the object', () => {
    expect(rule('.universe-object__label')?.get('top')).toBe('calc(100% + var(--space-4))');
    expect(tokens.get('--space-4')).toBe('16px');
  });

  it('makes the touch area the box plus 16 px', () => {
    expect(rule('.universe-object__target')?.get('inset')).toBe('calc(var(--space-4) * -1)');
  });

  it('fades to 20% at scale 0.85 and hides the label', () => {
    const faded = rule(".universe-object[data-state='faded']");
    expect(faded?.get('opacity')).toBe('var(--opacity-universe-muted)');
    expect(faded?.get('transform')).toBe('scale(0.85)');
    expect(tokens.get('--opacity-universe-muted')).toBe('0.2');
    expect(
      rule(".universe-object[data-state='faded'] .universe-object__label")?.get('visibility'),
    ).toBe('hidden');
  });

  it('lets the float own the transform of its layer', () => {
    const float = rule('.universe-object__float');
    expect(float?.has('transform')).toBe(false);
    expect(float?.has('transition')).toBe(false);
  });
});

describe('universe.css: main prompt', () => {
  it('sits at the top left of the safe area, 980 px wide, above the objects', () => {
    const prompt = rule('.main-prompt');
    expect(prompt?.get('top')).toBe('var(--space-9)');
    expect(prompt?.get('left')).toBe('var(--space-9)');
    expect(prompt?.get('width')).toBe('var(--main-prompt-width)');
    expect(prompt?.get('z-index')).toBe('var(--depth-80)');
    expect(prompt?.get('pointer-events')).toBe('none');
    expect(tokens.get('--space-9')).toBe('64px');
    expect(own.get('--main-prompt-width')).toBe('980px');
  });

  it('draws the ring from 48 to 72 px, 35% to 0, in 2.4 s, forever, with the exit curve', () => {
    expect(own.get('--main-prompt-icon')).toBe('48px');
    expect(rule('.main-prompt__ring')?.get('animation')).toBe(
      'main-prompt-ring 2400ms var(--easing-exit) infinite',
    );
    const keyframes =
      /@keyframes main-prompt-ring\s*\{\s*from\s*\{([^}]*)\}\s*to\s*\{([^}]*)\}/.exec(universeCss);
    expect(keyframes?.[1]).toMatch(/opacity:\s*0\.35/);
    expect(keyframes?.[1]).toMatch(/scale\(1\)/);
    expect(keyframes?.[2]).toMatch(/opacity:\s*0;/);
    expect(keyframes?.[2]).toMatch(/scale\(1\.5\)/);
    expect(48 * 1.5).toBe(72);
  });

  it('animates only transform and opacity', () => {
    const body = /@keyframes main-prompt-ring\s*\{([\s\S]*?\})\s*\}/.exec(universeCss)?.[1] ?? '';
    const properties = [...body.matchAll(/([a-z-]+)\s*:/g)].map((match) => match[1]);
    expect(new Set(properties)).toEqual(new Set(['opacity', 'transform']));
  });

  it('uses the Display and Body Large styles through the classes of the typography', () => {
    expect(typographyCss).toContain('.type-display');
    expect(typographyCss).toContain('.type-body-large');
  });
});

describe('universe.css: tokens', () => {
  it('uses only tokens that exist', () => {
    const used = new Set(
      [...universeCss.matchAll(/var\((--[a-z0-9-]+)\)/g)].map((match) => match[1]!),
    );
    expect(used.size).toBeGreaterThan(10);
    for (const name of used) {
      expect(tokens.has(name) || own.has(name), name).toBe(true);
    }
  });

  it('has no comments and no hard-coded colors', () => {
    expect(universeCss).not.toMatch(/\/\*/);
    expect(universeCss).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|hsl\(/i);
  });
});
