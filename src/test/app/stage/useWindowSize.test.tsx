import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useWindowSize } from '@/app/stage/useWindowSize';

function Probe() {
  const { width, height } = useWindowSize();
  return <p data-testid="probe">{`${width}x${height}`}</p>;
}

function setWindowSize(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
}

describe('useWindowSize', () => {
  afterEach(() => setWindowSize(1024, 768));

  it('updates when the window is resized', () => {
    setWindowSize(1000, 700);
    render(<Probe />);
    act(() => {
      setWindowSize(1400, 900);
      window.dispatchEvent(new Event('resize'));
    });
    expect(screen.getByTestId('probe').textContent).toBe('1400x900');
  });
});
