import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '@/app/App';

const inside = { pointerId: 1, clientX: 0, clientY: 0 };

describe('App · Universe', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1920 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1080 });
    window.history.pushState({}, '', '/');
  });

  it('opens on the universe: the call and the 8 objects', () => {
    render(<App />);
    expect(screen.getByTestId('universe')).toBeTruthy();
    expect(screen.getByTestId('main-prompt')).toBeTruthy();
    expect(screen.getAllByTestId('universe-object')).toHaveLength(8);
  });

  it('keeps the background behind the universe', () => {
    render(<App />);
    const stage = screen.getByTestId('stage');
    expect(stage.children[0]).toBe(screen.getByTestId('background'));
    expect(stage.children[1]).toBe(screen.getByTestId('universe'));
  });

  it('does not show the session readout without ?grid', () => {
    render(<App />);
    expect(screen.queryByTestId('session-readout')).toBeNull();
  });

  it('shows the session readout with ?grid and follows the touch of the visitor', () => {
    window.history.pushState({}, '', '/?grid');
    render(<App />);
    const readout = screen.getByTestId('session-readout');
    expect(readout.textContent).toContain('nível universo');
    expect(readout.textContent).toContain('objeto —');

    const bicycle = screen.getByRole('button', { name: 'Bicicleta' });
    fireEvent.pointerDown(bicycle, inside);
    fireEvent.pointerUp(bicycle, inside);

    expect(readout.textContent).toContain('nível objeto');
    expect(readout.textContent).toContain('objeto bicycle');
  });

  it('toggles the session readout with the grid, key G', () => {
    render(<App />);
    fireEvent.keyDown(window, { key: 'g' });
    expect(screen.getByTestId('session-readout')).toBeTruthy();
    fireEvent.keyDown(window, { key: 'g' });
    expect(screen.queryByTestId('session-readout')).toBeNull();
  });

  it('gives the showcase the whole Stage, without the universe floating behind it', async () => {
    window.history.pushState({}, '', '/?showcase');
    render(<App />);
    expect(await screen.findByTestId('showcase')).toBeTruthy();
    expect(screen.queryByTestId('universe')).toBeNull();
    expect(screen.queryByTestId('station-error')).toBeNull();
  }, 10_000);
});
