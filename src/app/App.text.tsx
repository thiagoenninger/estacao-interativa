import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';

function setWindowSize(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
}

describe('App · Stage', () => {
  beforeEach(() => {
    setWindowSize(1920, 1080);
    window.history.pushState({}, '', '/');
  });

  it('renders the Stage with scale 1 at Full HD', () => {
    render(<App />);
    expect(screen.getByTestId('stage').style.transform).toBe('translate(0px, 0px) scale(1)');
  });

  it('rescales the Stage when the window size changes', () => {
    render(<App />);
    act(() => {
      setWindowSize(960, 540);
      window.dispatchEvent(new Event('resize'));
    });
    expect(screen.getByTestId('stage').style.transform).toBe('translate(0px, 0px) scale(0.5)');
  });

  it('the debug grid starts hidden and toggles with the G key', () => {
    render(<App />);
    expect(screen.queryByTestId('debug-grid')).toBeNull();

    fireEvent.keyDown(window, { key: 'g' });
    expect(screen.getByTestId('debug-grid')).toBeTruthy();
    expect(screen.getByTestId('stage-diagnostics').textContent).toContain('scale 1.000');

    fireEvent.keyDown(window, { key: 'G' });
    expect(screen.queryByTestId('debug-grid')).toBeNull();
  });

  it('the grid opens right away with ?grid in the URL', () => {
    window.history.pushState({}, '', '/?grid');
    render(<App />);
    expect(screen.getByTestId('debug-grid')).toBeTruthy();
  });
});
