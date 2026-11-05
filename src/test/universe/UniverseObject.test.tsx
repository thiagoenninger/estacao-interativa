import { fireEvent, render, screen } from '@testing-library/react';
import { gsap } from 'gsap';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadContent } from '@/content';
import { UniverseObject } from '@/universe/UniverseObject';

const index = loadContent().index!;
const bicycle = index.getObject('bicycle')!;
const car = index.getObject('car')!;
const watch = index.getObject('watch')!;

const inside = { pointerId: 1, clientX: 0, clientY: 0 };
const outside = { pointerId: 1, clientX: 500, clientY: 500 };

type Tick = (time: number, deltaMs: number) => void;

function driveTicker() {
  const callbacks = new Set<Tick>();
  vi.spyOn(gsap.ticker, 'add').mockImplementation(((callback: Tick) => {
    callbacks.add(callback);
    return callback;
  }) as never);
  vi.spyOn(gsap.ticker, 'remove').mockImplementation(((callback: Tick) => {
    callbacks.delete(callback);
  }) as never);
  return { frame: (deltaMs = 16) => callbacks.forEach((callback) => callback(0, deltaMs)) };
}

function verticalReach(element: HTMLElement, frames: number, frame: () => void): number {
  let reach = 0;
  for (let i = 0; i < frames; i += 1) {
    frame();
    const y = Number(/translate3d\([^,]+,\s*(-?[\d.]+)px/.exec(element.style.transform)?.[1] ?? 0);
    reach = Math.max(reach, Math.abs(y));
  }
  return reach;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('UniverseObject: what is on the screen', () => {
  it('is a button named by the object, with the drawing hidden from assistive technology', () => {
    render(<UniverseObject item={bicycle} />);
    expect(screen.getByRole('button', { name: 'Bicicleta' })).toBeTruthy();
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('draws the universe view of the file of the object', () => {
    const { container } = render(<UniverseObject item={bicycle} />);
    const drawing = container.querySelector('svg.object-drawing');
    expect(drawing?.getAttribute('data-view')).toBe('universe');
    expect(drawing?.getAttribute('data-object')).toBe('object-bicycle.svg');
  });

  it('shows the name of the object as a label', () => {
    const { container } = render(<UniverseObject item={car} />);
    expect(container.querySelector('.universe-object__label')?.textContent).toBe('Automóvel');
  });

  it('places the box around the position of the object, sized by its plane', () => {
    render(<UniverseObject item={bicycle} />);
    const root = screen.getByTestId('universe-object');
    expect(root.getAttribute('data-plane')).toBe('near');
    expect(parseFloat(root.style.width)).toBeCloseTo(340, 3);
    expect(parseFloat(root.style.left) + parseFloat(root.style.width) / 2).toBeCloseTo(560, 3);
    expect(parseFloat(root.style.top) + parseFloat(root.style.height) / 2).toBeCloseTo(590, 3);
  });

  it('is sized 200 px on the far plane', () => {
    render(<UniverseObject item={watch} />);
    expect(parseFloat(screen.getByTestId('universe-object').style.height)).toBeCloseTo(200, 3);
  });
});

describe('UniverseObject: touch', () => {
  it('shows pressed on pointer down and runs the action on pointer up, inside', () => {
    const onSelect = vi.fn();
    render(<UniverseObject item={bicycle} onSelect={onSelect} />);
    const root = screen.getByTestId('universe-object');
    const button = screen.getByRole('button');
    expect(root.getAttribute('data-pressed')).toBe('false');
    fireEvent.pointerDown(button, inside);
    expect(root.getAttribute('data-pressed')).toBe('true');
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.pointerUp(button, inside);
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('bicycle');
    expect(root.getAttribute('data-pressed')).toBe('false');
  });

  it('cancels when the finger leaves the target', () => {
    const onSelect = vi.fn();
    render(<UniverseObject item={bicycle} onSelect={onSelect} />);
    const button = screen.getByRole('button');
    fireEvent.pointerDown(button, inside);
    fireEvent.pointerMove(button, outside);
    fireEvent.pointerUp(button, outside);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('works without a handler', () => {
    render(<UniverseObject item={bicycle} />);
    const button = screen.getByRole('button');
    fireEvent.pointerDown(button, inside);
    expect(() => fireEvent.pointerUp(button, inside)).not.toThrow();
  });
});

describe('UniverseObject: faded', () => {
  it('is faded only when asked', () => {
    const { rerender } = render(<UniverseObject item={bicycle} />);
    expect(screen.getByTestId('universe-object').getAttribute('data-state')).toBe('default');
    rerender(<UniverseObject item={bicycle} faded />);
    expect(screen.getByTestId('universe-object').getAttribute('data-state')).toBe('faded');
  });
});

describe('UniverseObject: the idle float (M08)', () => {
  it('floats on its own layer, never on the box that will be animated', () => {
    const { frame } = driveTicker();
    render(<UniverseObject item={bicycle} />);
    frame();
    expect(screen.getByTestId('universe-float').style.transform).toContain('translate3d(');
    expect(screen.getByTestId('universe-object').style.transform).toBe('');
  });

  it('floats up to 6 px on the near plane', () => {
    const { frame } = driveTicker();
    render(<UniverseObject item={bicycle} />);
    const reach = verticalReach(screen.getByTestId('universe-float'), 1000, frame);
    expect(reach).toBeGreaterThan(5);
    expect(reach).toBeLessThanOrEqual(6.01);
  });

  it('floats only 3 px on the far plane', () => {
    const { frame } = driveTicker();
    render(<UniverseObject item={watch} />);
    const reach = verticalReach(screen.getByTestId('universe-float'), 1000, frame);
    expect(reach).toBeGreaterThan(2.5);
    expect(reach).toBeLessThanOrEqual(3.01);
  });

  it('keeps floating, at 3 px at most, when faded', () => {
    const { frame } = driveTicker();
    render(<UniverseObject item={bicycle} faded />);
    const reach = verticalReach(screen.getByTestId('universe-float'), 1000, frame);
    expect(reach).toBeGreaterThan(2.5);
    expect(reach).toBeLessThanOrEqual(3.01);
  });

  it('stops floating and clears the transform when it leaves the screen', () => {
    const { frame } = driveTicker();
    const { unmount } = render(<UniverseObject item={bicycle} />);
    frame();
    const element = screen.getByTestId('universe-float');
    unmount();
    expect(element.style.transform).toBe('');
  });
});
