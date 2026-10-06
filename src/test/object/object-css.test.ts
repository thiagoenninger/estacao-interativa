import { describe, expect, it } from 'vitest';
import colorCss from '@/design-system/tokens/color.css?raw';
import spaceShapeCss from '@/design-system/tokens/space-shape.css?raw';
import objectCss from '@/object/object.css?raw';
import { STROKE, STROKE_RATIO } from '@/object/drawing-measures.ts';
import { parseCustomProperties, parseRules } from '@/test/css';

const properties = parseCustomProperties(objectCss);
const rules = parseRules(objectCss);
/** The CSS without its comments, to look for what must not be there. */
const code = objectCss.replace(/\/\*[\s\S]*?\*\//g, '');
const rule = (selector: string) => rules.get(`.object-drawing ${selector}`);

describe('object.css: CSS and TypeScript say the same thing', () => {
  it.each(Object.entries(STROKE))('stroke-%s', (name, pixels) => {
    expect(properties.get(`--object-stroke-${name}`)).toBe(`${pixels}px`);
  });

  it.each(Object.entries(STROKE_RATIO))('ratio %s', (name, ratio) => {
    expect(properties.get(`--object-stroke-${name}-ratio`)).toBe(String(ratio));
  });
});

describe('object.css: strokes (Foundations 07)', () => {
  it('uses the universe stroke by default, the selected one for the selected view', () => {
    expect(rules.get('.object-drawing')?.get('--object-stroke')).toBe(
      'var(--object-stroke-universe)',
    );
    expect(rules.get(".object-drawing[data-view='selected']")?.get('--object-stroke')).toBe(
      'var(--object-stroke-selected)',
    );
    expect(rules.get(".object-drawing[data-view='thumbnail']")?.get('--object-stroke')).toBe(
      'var(--object-stroke-thumbnail)',
    );
  });

  it('measures the stroke on the screen, whatever the scale', () => {
    expect(rules.get('.object-drawing *')?.get('vector-effect')).toBe('non-scaling-stroke');
  });

  it('draws the dashed stroke with dash 7 6, thin like the fine one', () => {
    expect(rule("[data-stroke='dashed']")?.get('stroke-dasharray')).toBe('7 6');
    expect(rule("[data-stroke='dashed']")?.get('--stroke-weight')).toBe(
      'var(--object-stroke-fine-ratio)',
    );
    expect(rule("[data-stroke='fine']")?.get('--stroke-weight')).toBe(
      'var(--object-stroke-fine-ratio)',
    );
  });

  it('fills only the solid pieces', () => {
    expect(rule("[data-stroke='filled']")?.get('fill')).toBe('currentColor');
    expect(rule("[data-stroke='line']")).toBeUndefined();
  });
});

describe('object.css: states', () => {
  it('highlights with a thicker stroke and the active color (never only the color)', () => {
    expect(rule("[data-state='highlight']")?.get('--stroke-boost')).toBe(
      'var(--object-stroke-highlight-ratio)',
    );
    expect(rule("[data-state='highlight']")?.get('stroke')).toBe('var(--color-state-active)');
  });

  it('recedes by group, with the opacity token and no mask', () => {
    expect(rule("[data-state='recede']")?.get('stroke-opacity')).toBe(
      'var(--opacity-object-recede)',
    );
    expect(code).not.toMatch(/mask|filter|clip-path/);
  });

  it('switches groups off with display none', () => {
    expect(rule("[data-visible='false']")?.get('display')).toBe('none');
  });

  it('has no animation yet: the motion comes with the choreographies', () => {
    expect(code).not.toMatch(/transition|animation|@keyframes/);
  });

  it('uses tokens that exist, with the values of the Design System', () => {
    expect(parseCustomProperties(spaceShapeCss).get('--opacity-object-recede')).toBe('0.2');
    expect(parseCustomProperties(colorCss).has('--color-state-active')).toBe(true);
  });
});
