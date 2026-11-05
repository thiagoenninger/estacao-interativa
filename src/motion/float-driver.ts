import { gsap } from 'gsap';
import type { FloatMode, FloatModel } from './float.ts';

export interface Ticker {
  add(callback: (time: number, deltaMs: number) => void): unknown;
  remove(callback: (time: number, deltaMs: number) => void): unknown;
}

export interface FloatHandle {
  readonly model: FloatModel;
  setMode(mode: FloatMode): void;
  stop(): void;
}

function decimals(value: number, places: number): string {
  const scale = 10 ** places;
  return (Math.round(value * scale) / scale + 0).toFixed(places);
}

export function startFloat(
  element: HTMLElement,
  model: FloatModel,
  ticker: Ticker = gsap.ticker,
): FloatHandle {
  const tick = (_time: number, deltaMs: number): void => {
    const { x, y, rotation } = model.advance(deltaMs);
    element.style.transform = `translate3d(${decimals(x, 3)}px, ${decimals(y, 3)}px, 0) rotate(${decimals(rotation, 4)}deg)`;
  };
  ticker.add(tick);

  return {
    model,
    setMode: (mode) => model.setMode(mode),
    stop() {
      ticker.remove(tick);
      element.style.transform = '';
    },
  };
}
