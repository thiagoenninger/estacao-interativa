import { describe, expect, it } from 'vitest';
import {
  createFloatModel,
  drawFloatParams,
  FADED_AMPLITUDE,
  FLOAT_AMPLITUDE,
  FLOAT_BLEND_TAU,
  SELECTED_AMPLITUDE,
  type FloatDepth,
  type FloatMode,
  type FloatParams,
} from '@/motion/float';
import { createRandom } from '@/motion/random';
import { DURATION, IDLE } from '@/motion/tokens';

const STEP = 16;

function peaks(depth: FloatDepth, mode: FloatMode, params?: FloatParams, ms = 30000) {
  const model = createFloatModel(params ?? drawFloatParams(depth, createRandom(3)), mode);
  let y = 0;
  let x = 0;
  let rotation = 0;
  for (let elapsed = 0; elapsed < ms; elapsed += STEP) {
    const sample = model.advance(STEP);
    y = Math.max(y, Math.abs(sample.y));
    x = Math.max(x, Math.abs(sample.x));
    rotation = Math.max(rotation, Math.abs(sample.rotation));
  }
  return { y, x, rotation };
}

describe('the draw, once per object', () => {
  it('picks a period from 8 to 14 s', () => {
    for (let seed = 1; seed <= 200; seed += 1) {
      const { periodMs } = drawFloatParams('mid', createRandom(seed));
      expect(periodMs).toBeGreaterThanOrEqual(IDLE.cycleMin);
      expect(periodMs).toBeLessThanOrEqual(IDLE.cycleMax);
    }
  });

  it('takes the extremes of the range from the extremes of the draw', () => {
    expect(drawFloatParams('far', () => 0).periodMs).toBe(8000);
    expect(drawFloatParams('far', () => 0.999999).periodMs).toBeCloseTo(14000, 0);
  });

  it('never gives two objects the same phase: they do not move in step', () => {
    const random = createRandom(11);
    const phases = Array.from({ length: 12 }, () => drawFloatParams('near', random).phase);
    expect(new Set(phases.map((phase) => phase.toFixed(6))).size).toBe(12);
  });

  it('draws angles within one turn', () => {
    const params = drawFloatParams('mid', createRandom(5));
    for (const angle of [params.phase, params.rotationPhase, params.driftPhase]) {
      expect(angle).toBeGreaterThanOrEqual(0);
      expect(angle).toBeLessThan(Math.PI * 2);
    }
  });

  it('is repeatable with the same seed', () => {
    expect(drawFloatParams('mid', createRandom(9))).toEqual(
      drawFloatParams('mid', createRandom(9)),
    );
  });
});

describe('amplitudes by depth (Motion 04, M08)', () => {
  it.each([
    ['near', 6],
    ['mid', 4],
    ['far', 3],
  ] as const)('a %s object floats %d px', (depth, amplitude) => {
    expect(FLOAT_AMPLITUDE[depth]).toBe(amplitude);
    const { y } = peaks(depth, 'free');
    expect(y).toBeGreaterThan(amplitude * 0.99);
    expect(y).toBeLessThanOrEqual(amplitude + 1e-9);
  });

  it('rotates at most 1 degree and drifts at most 2 px', () => {
    const { rotation, x } = peaks('near', 'free');
    expect(rotation).toBeGreaterThan(0.95);
    expect(rotation).toBeLessThanOrEqual(1 + 1e-9);
    expect(x).toBeGreaterThan(1.9);
    expect(x).toBeLessThanOrEqual(2 + 1e-9);
  });

  it('a faded object floats at most 3 px, even a near one', () => {
    expect(FADED_AMPLITUDE).toBe(3);
    const { y } = peaks('near', 'faded');
    expect(y).toBeGreaterThan(2.9);
    expect(y).toBeLessThanOrEqual(3 + 1e-9);
  });

  it('a faded far object keeps its own 3 px, not more', () => {
    expect(peaks('far', 'faded').y).toBeLessThanOrEqual(3 + 1e-9);
  });

  it('the selected object floats 2 px, without rotation or drift', () => {
    expect(SELECTED_AMPLITUDE).toBe(2);
    const { y, x, rotation } = peaks('near', 'selected');
    expect(y).toBeGreaterThan(1.9);
    expect(y).toBeLessThanOrEqual(2 + 1e-9);
    expect(x).toBe(0);
    expect(rotation).toBe(0);
  });

  it('a still object does not move at all', () => {
    expect(peaks('near', 'still')).toEqual({ y: 0, x: 0, rotation: 0 });
  });
});

describe('periods', () => {
  it('the vertical float repeats after its period', () => {
    const params = drawFloatParams('mid', createRandom(21));
    const model = createFloatModel(params, 'free');
    const start = model.sample();
    model.advance(params.periodMs);
    expect(model.sample().y).toBeCloseTo(start.y, 6);
  });

  it('the rotation takes 1.3 times as long and the drift 1.7 times', () => {
    const params = drawFloatParams('mid', createRandom(21));
    const rotation = createFloatModel(params, 'free');
    const start = rotation.sample().rotation;
    rotation.advance(params.periodMs * 1.3);
    expect(rotation.sample().rotation).toBeCloseTo(start, 6);

    const drift = createFloatModel(params, 'free');
    const startX = drift.sample().x;
    drift.advance(params.periodMs * 1.7);
    expect(drift.sample().x).toBeCloseTo(startX, 6);
  });

  it('flashes far less than 3 times a second: the fastest period is 8 s', () => {
    expect(1000 / IDLE.cycleMin).toBeLessThan(3);
  });
});

describe('changing mode never makes the object jump', () => {
  it('moves less than a pixel in one frame when the mode flips', () => {
    const modes: FloatMode[] = ['free', 'still', 'selected', 'faded', 'free'];
    const model = createFloatModel(drawFloatParams('near', createRandom(4)), 'free');
    let previous = model.advance(STEP);
    for (const mode of modes) {
      model.setMode(mode);
      for (let frame = 0; frame < 120; frame += 1) {
        const sample = model.advance(STEP);
        expect(Math.abs(sample.y - previous.y)).toBeLessThan(1);
        expect(Math.abs(sample.x - previous.x)).toBeLessThan(1);
        expect(Math.abs(sample.rotation - previous.rotation)).toBeLessThan(0.2);
        previous = sample;
      }
    }
  });

  it('is within 5% of the new amplitude after one base duration (320 ms)', () => {
    expect(FLOAT_BLEND_TAU * 3).toBeCloseTo(DURATION.base, 6);
    const params: FloatParams = {
      depth: 'near',
      periodMs: 10000,
      phase: Math.PI / 2,
      rotationPhase: 0,
      driftPhase: 0,
    };
    const model = createFloatModel(params, 'free');
    model.setMode('still');
    let value = model.sample().y;
    expect(value).toBeCloseTo(6, 6);
    const frames = Math.round(DURATION.base / 4);
    for (let frame = 0; frame < frames; frame += 1) value = model.advance(4).y;
    expect(Math.abs(value)).toBeLessThan(6 * 0.05 + 0.01);
  });

  it('starts in the mode it is given, without gliding from another', () => {
    const params: FloatParams = {
      depth: 'mid',
      periodMs: 10000,
      phase: Math.PI / 2,
      rotationPhase: 0,
      driftPhase: 0,
    };
    expect(createFloatModel(params, 'selected').sample().y).toBeCloseTo(2, 6);
    expect(createFloatModel(params, 'free').sample().y).toBeCloseTo(4, 6);
  });

  it('ignores a negative time step', () => {
    const model = createFloatModel(drawFloatParams('mid', createRandom(2)));
    const before = model.sample();
    expect(model.advance(-500)).toEqual(before);
  });

  it('reports its mode', () => {
    const model = createFloatModel(drawFloatParams('mid', createRandom(2)), 'faded');
    expect(model.mode).toBe('faded');
    model.setMode('selected');
    expect(model.mode).toBe('selected');
  });
});
