import { afterEach, describe, expect, it } from 'vitest';
import { MIN_TOUCH_OPACITY, effectiveOpacity, isEntering } from '@/interaction';

function build(...opacities: string[]): HTMLElement {
  let parent: HTMLElement = document.body;
  for (const opacity of opacities) {
    const child = document.createElement('div');
    child.style.opacity = opacity;
    parent.append(child);
    parent = child;
  }
  return parent;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('effective opacity', () => {
  it('an element with no opacity set is fully visible', () => {
    expect(effectiveOpacity(build(''))).toBe(1);
  });

  it('reads the opacity of the element itself', () => {
    expect(effectiveOpacity(build('0.3'))).toBeCloseTo(0.3);
  });

  it('multiplies the opacity of every ancestor', () => {
    expect(effectiveOpacity(build('0.5', '0.5', '0.8'))).toBeCloseTo(0.2);
  });

  it('is zero when any ancestor is invisible', () => {
    expect(effectiveOpacity(build('0', '1', '1'))).toBe(0);
  });
});

describe('an element that is still entering', () => {
  it('the limit is 50%', () => {
    expect(MIN_TOUCH_OPACITY).toBe(0.5);
  });

  it('is entering below 50%', () => {
    expect(isEntering(build('0.49'))).toBe(true);
    expect(isEntering(build('0'))).toBe(true);
  });

  it('is touchable from 50% up', () => {
    expect(isEntering(build('0.5'))).toBe(false);
    expect(isEntering(build('1'))).toBe(false);
  });

  it('counts the parent that is fading in', () => {
    expect(isEntering(build('0.4', '1'))).toBe(true);
    expect(isEntering(build('0.9', '0.9'))).toBe(false);
  });
});
