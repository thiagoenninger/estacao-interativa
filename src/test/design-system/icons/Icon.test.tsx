import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Icon } from '@/design-system/icons/Icon';
import { ICON_NAMES, ICON_SIZE } from '@/design-system/icons/icon-names';
import { getIconMarkup, getIconSource, listIconFileNames } from '@/design-system/icons/icon-source';

describe('icon set (Foundations 05)', () => {
  it('has exactly the 12 icons, one file each', () => {
    expect(ICON_NAMES).toHaveLength(12);
    expect(listIconFileNames()).toEqual([...ICON_NAMES].sort());
  });

  it.each(ICON_NAMES)('icon-%s follows the specification', (name) => {
    const source = getIconSource(name);
    expect(source).toContain('viewBox="0 0 24 24"');
    expect(source).toContain('stroke="currentColor"');
    expect(source).toContain('stroke-width="1.5"');
    expect(source).toContain('stroke-linecap="butt"');
    expect(source).toContain('stroke-linejoin="miter"');
    expect(source).toContain('fill="none"');
    expect(getIconMarkup(name).length).toBeGreaterThan(0);
  });

  it('has no fill color or fixed stroke color inside the drawings', () => {
    for (const name of ICON_NAMES) {
      expect(getIconMarkup(name)).not.toMatch(/(fill|stroke)="(?!none)/);
    }
  });
});

describe('Icon', () => {
  it('draws the shapes of the file, at the requested size', () => {
    const { container } = render(<Icon name="close" size="lg" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe(String(ICON_SIZE.lg));
    expect(svg?.getAttribute('height')).toBe(String(ICON_SIZE.lg));
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
    // Parse the source the same way the DOM does, so `<path/>` and `<path></path>` compare equal.
    const reference = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    reference.innerHTML = getIconMarkup('close');
    expect(svg?.innerHTML).toBe(reference.innerHTML);
  });

  it('is 28 px by default (icon-md)', () => {
    const { container } = render(<Icon name="back" />);
    expect(container.querySelector('svg')?.getAttribute('width')).toBe('28');
  });

  it('is decorative without a label and named with one', () => {
    const { container, rerender } = render(<Icon name="info" />);
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    rerender(<Icon name="info" label="Informação" />);
    expect(screen.getByRole('img', { name: 'Informação' })).toBeTruthy();
  });
});
