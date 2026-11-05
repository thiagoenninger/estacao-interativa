import { DURATION, IDLE } from './tokens.ts';

export type FloatDepth = 'near' | 'mid' | 'far';

export type FloatMode = 'free' | 'faded' | 'selected' | 'still';

export const FLOAT_AMPLITUDE: Readonly<Record<FloatDepth, number>> = { near: 6, mid: 4, far: 3 };
export const FADED_AMPLITUDE = 3;
export const SELECTED_AMPLITUDE = 2;
export const ROTATION_AMPLITUDE = 1;
export const DRIFT_AMPLITUDE = 2;
export const ROTATION_PERIOD_FACTOR = 1.3;
export const DRIFT_PERIOD_FACTOR = 1.7;
export const FLOAT_BLEND_TAU = DURATION.base / 3;

export interface FloatParams {
  depth: FloatDepth;
  periodMs: number;
  phase: number;
  rotationPhase: number;
  driftPhase: number;
}

export interface FloatSample {
  x: number;
  y: number;
  rotation: number;
}

const TURN = Math.PI * 2;

export function drawFloatParams(depth: FloatDepth, random: () => number): FloatParams {
  return {
    depth,
    periodMs: IDLE.cycleMin + random() * (IDLE.cycleMax - IDLE.cycleMin),
    phase: random() * TURN,
    rotationPhase: random() * TURN,
    driftPhase: random() * TURN,
  };
}

interface Levels {
  y: number;
  rotation: number;
  drift: number;
}

function levelsFor(params: FloatParams, mode: FloatMode): Levels {
  switch (mode) {
    case 'free':
      return {
        y: FLOAT_AMPLITUDE[params.depth],
        rotation: ROTATION_AMPLITUDE,
        drift: DRIFT_AMPLITUDE,
      };
    case 'faded':
      return {
        y: Math.min(FLOAT_AMPLITUDE[params.depth], FADED_AMPLITUDE),
        rotation: ROTATION_AMPLITUDE,
        drift: DRIFT_AMPLITUDE,
      };
    case 'selected':
      return { y: SELECTED_AMPLITUDE, rotation: 0, drift: 0 };
    case 'still':
      return { y: 0, rotation: 0, drift: 0 };
  }
}

export interface FloatModel {
  readonly params: FloatParams;
  readonly mode: FloatMode;
  setMode(mode: FloatMode): void;
  advance(deltaMs: number): FloatSample;
  sample(): FloatSample;
}

export function createFloatModel(params: FloatParams, initialMode: FloatMode = 'free'): FloatModel {
  let mode = initialMode;
  let elapsed = 0;
  let levels = levelsFor(params, mode);

  const sample = (): FloatSample => ({
    y: levels.y * Math.sin((TURN * elapsed) / params.periodMs + params.phase),
    rotation:
      levels.rotation *
      Math.sin(
        (TURN * elapsed) / (params.periodMs * ROTATION_PERIOD_FACTOR) + params.rotationPhase,
      ),
    x:
      levels.drift *
      Math.sin((TURN * elapsed) / (params.periodMs * DRIFT_PERIOD_FACTOR) + params.driftPhase),
  });

  return {
    params,
    get mode() {
      return mode;
    },
    setMode(next) {
      mode = next;
    },
    advance(deltaMs) {
      const delta = Math.max(0, deltaMs);
      const target = levelsFor(params, mode);
      const share = 1 - Math.exp(-delta / FLOAT_BLEND_TAU);
      levels = {
        y: levels.y + (target.y - levels.y) * share,
        rotation: levels.rotation + (target.rotation - levels.rotation) * share,
        drift: levels.drift + (target.drift - levels.drift) * share,
      };
      elapsed += delta;
      return sample();
    },
    sample,
  };
}
