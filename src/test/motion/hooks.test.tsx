import { act, render, renderHook } from '@testing-library/react';
import { gsap } from 'gsap';
import { StrictMode, useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button } from '@/design-system/buttons/Button';
import { useFloat, useMotionChannel } from '@/motion/hooks';
import { defineChoreography } from '@/motion/choreography';
import { createRandom } from '@/motion/random';
import type { FloatMode } from '@/motion/float';
import type { PlayHandle } from '@/motion/channel';
import type { FloatDepth } from '@/motion/float';

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
  return {
    callbacks,
    frame: (deltaMs = 16) => callbacks.forEach((callback) => callback(0, deltaMs)),
  };
}

function Floating(props: { depth?: FloatDepth; mode?: FloatMode; random?: () => number }) {
  const ref = useRef<HTMLDivElement>(null);
  useFloat(ref, { depth: props.depth ?? 'near', mode: props.mode, random: props.random });
  return <div ref={ref} data-testid="floater" />;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useFloat', () => {
  it('floats the element on every frame', () => {
    const { frame } = driveTicker();
    const { getByTestId } = render(<Floating random={createRandom(1)} />);
    const element = getByTestId('floater');
    expect(element.style.transform).toBe('');
    frame();
    expect(element.style.transform).toContain('translate3d(');
  });

  it('draws the period and phases once, not on every render', () => {
    driveTicker();
    const random = vi.fn(createRandom(1));
    const { rerender } = render(<Floating random={random} />);
    const draws = random.mock.calls.length;
    expect(draws).toBe(4);
    rerender(<Floating random={random} mode="selected" />);
    rerender(<Floating random={random} mode="free" />);
    expect(random.mock.calls.length).toBe(draws);
  });

  it('follows a change of mode without starting over', () => {
    const { frame, callbacks } = driveTicker();
    const { getByTestId, rerender } = render(<Floating random={createRandom(2)} mode="free" />);
    rerender(<Floating random={createRandom(2)} mode="still" />);
    for (let step = 0; step < 100; step += 1) frame();
    expect(callbacks.size).toBe(1);
    expect(getByTestId('floater').style.transform).toContain('translate3d(0.000px, 0.000px');
  });

  it('stops on unmount and leaves nothing on the clock', () => {
    const { callbacks } = driveTicker();
    const { unmount } = render(<Floating random={createRandom(3)} />);
    expect(callbacks.size).toBe(1);
    unmount();
    expect(callbacks.size).toBe(0);
  });

  it('keeps exactly one callback under StrictMode, which mounts twice', () => {
    const { callbacks } = driveTicker();
    const { unmount } = render(
      <StrictMode>
        <Floating random={createRandom(4)} />
      </StrictMode>,
    );
    expect(callbacks.size).toBe(1);
    unmount();
    expect(callbacks.size).toBe(0);
  });

  it('two objects get two different movements', () => {
    const { frame } = driveTicker();
    const random = createRandom(5);
    const { getAllByTestId } = render(
      <>
        <Floating random={random} />
        <Floating random={random} />
      </>,
    );
    frame(1000);
    const [a, b] = getAllByTestId('floater');
    expect(a?.style.transform).not.toBe(b?.style.transform);
  });
});

const grow = defineChoreography('grow', [
  { id: 'a', target: 'thing', at: 0, duration: 'slower', ease: 'standard', to: { scale: 3 } },
]);

describe('useMotionChannel', () => {
  it('gives the same channel on every render', () => {
    const { result, rerender } = renderHook(() => useMotionChannel());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it('stops the play in progress when the component goes away', async () => {
    const { result, unmount } = renderHook(() => useMotionChannel());
    const handle = result.current.play(grow, { thing: { scale: 1 } });
    unmount();
    await expect(handle.finished).resolves.toBe('stopped');
    expect(result.current.current()).toBeNull();
  });

  it('survives StrictMode, which unmounts and mounts again before the first touch', async () => {
    const { result } = renderHook(() => useMotionChannel(), { wrapper: StrictMode });
    const handle = result.current.play(grow, { thing: { scale: 1 } });
    expect(result.current.current()).toBe(handle);
    result.current.stop();
    await expect(handle.finished).resolves.toBe('stopped');
  });
});

describe('a touch that lands in the middle of a transition (ADR 0020 and 0021)', () => {
  it('passes the touch gate and takes the play over', async () => {
    const plays: PlayHandle[] = [];
    const thing = { scale: 1 };

    function Scene() {
      const motion = useMotionChannel();
      return <Button onPress={() => plays.push(motion.play(grow, { thing }))}>Tocar</Button>;
    }

    const { getByRole, unmount } = render(<Scene />);
    const button = getByRole('button', { name: 'Tocar' });
    const touch = (id: number) => {
      act(() => {
        button.dispatchEvent(new PointerEvent('pointerdown', { pointerId: id, bubbles: true }));
        button.dispatchEvent(new PointerEvent('pointerup', { pointerId: id, bubbles: true }));
      });
    };

    touch(1);
    expect(plays).toHaveLength(1);
    await new Promise((resolve) => setTimeout(resolve, 60));
    touch(2);
    expect(plays).toHaveLength(2);
    await expect(plays[0]?.finished).resolves.toBe('interrupted');

    unmount();
    await expect(plays[1]?.finished).resolves.toBe('stopped');
  });
});
