import { describe, expect, it, vi } from 'vitest';
import { startFloat, type Ticker } from '@/motion/float-driver';
import { createFloatModel, type FloatParams } from '@/motion/float';

type Tick = (time: number, deltaMs: number) => void;

function fakeTicker() {
  const callbacks = new Set<Tick>();
  const ticker: Ticker = {
    add: (callback) => callbacks.add(callback),
    remove: (callback) => callbacks.delete(callback),
  };
  const frame = (deltaMs = 16) => callbacks.forEach((callback) => callback(0, deltaMs));
  return { ticker, callbacks, frame };
}

const PARAMS: FloatParams = {
  depth: 'near',
  periodMs: 10000,
  phase: Math.PI / 2,
  rotationPhase: 0,
  driftPhase: 0,
};

describe('startFloat', () => {
  it('does nothing until the first frame', () => {
    const { ticker } = fakeTicker();
    const element = document.createElement('div');
    startFloat(element, createFloatModel(PARAMS), ticker);
    expect(element.style.transform).toBe('');
  });

  it('writes translate and rotate on every frame', () => {
    const { ticker, frame } = fakeTicker();
    const element = document.createElement('div');
    startFloat(element, createFloatModel(PARAMS), ticker);
    frame();
    expect(element.style.transform).toMatch(
      /^translate3d\(-?[\d.]+px, -?[\d.]+px, 0(px)?\) rotate\(-?[\d.]+deg\)$/,
    );
  });

  it('moves the element: the offset changes from one frame to the next', () => {
    const { ticker, frame } = fakeTicker();
    const element = document.createElement('div');
    startFloat(element, createFloatModel(PARAMS), ticker);
    frame(16);
    const first = element.style.transform;
    frame(2000);
    expect(element.style.transform).not.toBe(first);
  });

  it('uses only transform: no other style property is touched', () => {
    const { ticker, frame } = fakeTicker();
    const element = document.createElement('div');
    startFloat(element, createFloatModel(PARAMS), ticker);
    frame();
    frame();
    expect(element.style.length).toBe(1);
    expect(element.style.item(0)).toBe('transform');
  });

  it('follows the mode it is told', () => {
    const { ticker, frame } = fakeTicker();
    const element = document.createElement('div');
    const handle = startFloat(element, createFloatModel(PARAMS, 'free'), ticker);
    handle.setMode('still');
    expect(handle.model.mode).toBe('still');
    for (let step = 0; step < 100; step += 1) frame(16);
    expect(element.style.transform).toContain('translate3d(0.000px, 0.000px');
  });

  it('stop removes the callback and clears the offset', () => {
    const { ticker, callbacks, frame } = fakeTicker();
    const element = document.createElement('div');
    const handle = startFloat(element, createFloatModel(PARAMS), ticker);
    frame();
    expect(callbacks.size).toBe(1);
    handle.stop();
    expect(callbacks.size).toBe(0);
    expect(element.style.transform).toBe('');
    frame();
    expect(element.style.transform).toBe('');
  });

  it('each element runs on its own callback', () => {
    const { ticker, callbacks } = fakeTicker();
    const a = startFloat(document.createElement('div'), createFloatModel(PARAMS), ticker);
    startFloat(document.createElement('div'), createFloatModel(PARAMS), ticker);
    expect(callbacks.size).toBe(2);
    a.stop();
    expect(callbacks.size).toBe(1);
  });

  it('works with the real GSAP ticker by default', () => {
    const element = document.createElement('div');
    const handle = startFloat(element, createFloatModel(PARAMS));
    expect(typeof handle.stop).toBe('function');
    handle.stop();
    expect(vi.isMockFunction(handle.stop)).toBe(false);
  });
});
