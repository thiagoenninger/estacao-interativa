import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Background } from './Background';

describe('Background', () => {
  it('draws a registration mark in each of the four corners', () => {
    const { container } = render(<Background />);
    const marks = container.querySelectorAll('img.background-mark');
    expect(marks).toHaveLength(4);
    const corners = [...marks].map((mark) => mark.className);
    for (const corner of ['top-left', 'top-right', 'bottom-left', 'bottom-right']) {
      expect(
        corners.some((name) => name.includes(corner)),
        corner,
      ).toBe(true);
    }
  });

  it('is decorative: hidden from screen readers and blind to touch', () => {
    render(<Background />);
    expect(screen.getByTestId('background').getAttribute('aria-hidden')).toBe('true');
  });
});
