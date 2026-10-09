import { describe, expect, it } from 'vitest';
import spikeCss from '@/dev/spike/spike.css?raw';
import {
  EFFECTS,
  effectsOf,
  isKnownScene,
  MEASURE_MS,
  PHASE_INTERVAL_MS,
  SCENE_IDS,
  SCENES,
  showsSelection,
  usesPhases,
  WARMUP_MS,
} from '@/dev/spike/scenes';
import { DURATION } from '@/motion/tokens';

const code = spikeCss.replace(/\/\*[\s\S]*?\*\//g, '');

describe('the scenes', () => {
  it('have unique ids and a label, an effect list and a description each', () => {
    expect(new Set(SCENE_IDS).size).toBe(SCENES.length);
    for (const scene of SCENES) {
      expect(scene.label.length).toBeGreaterThan(0);
      expect(scene.description.length).toBeGreaterThan(20);
      expect(Array.isArray(effectsOf(scene.id))).toBe(true);
    }
  });

  it('start with the two baselines, which switch nothing on', () => {
    expect(SCENE_IDS.slice(0, 2)).toEqual(['idle', 'selected']);
    expect(effectsOf('idle')).toEqual([]);
    expect(effectsOf('selected')).toEqual([]);
    expect(usesPhases('idle')).toBe(false);
    expect(usesPhases('m02')).toBe(true);
  });

  it('only the first scene is the universe alone', () => {
    expect(showsSelection('idle')).toBe(false);
    expect(SCENE_IDS.slice(1).every(showsSelection)).toBe(true);
  });

  it('the two full M02 scenes differ only in how the material is shown', () => {
    const direct = new Set(effectsOf('m02'));
    const copy = new Set(effectsOf('m02-copy'));
    expect([...direct].filter((effect) => !copy.has(effect)).sort()).toEqual([
      'recede-group',
      'stroke-width',
    ]);
    expect([...copy].filter((effect) => !direct.has(effect))).toEqual(['recede-copy']);
  });

  it('every effect is used by some scene', () => {
    const used = new Set(SCENE_IDS.flatMap((id) => effectsOf(id)));
    expect([...used].sort()).toEqual([...EFFECTS].sort());
  });

  it('knows its own ids', () => {
    expect(isKnownScene('m02')).toBe(true);
    expect(isKnownScene('nope')).toBe(false);
  });
});

describe('spike.css has a block for every effect', () => {
  it.each(EFFECTS)('%s', (effect) => {
    expect(code).toContain(`[data-fx~='${effect}']`);
  });

  it('does not name an effect the code does not know', () => {
    const named = [...code.matchAll(/\[data-fx~='([a-z-]+)'\]/g)].map((match) => match[1]);
    expect(new Set(named)).toEqual(new Set(EFFECTS));
  });

  it('the phase "a" and "b" of every effect are on the same stage', () => {
    expect(code).toContain("[data-phase='a']");
    expect(code).toContain("[data-phase='b']");
  });
});

describe('timing', () => {
  it('the phase changes a little after the 1560 ms of M02: the scene never rests', () => {
    expect(PHASE_INTERVAL_MS).toBeGreaterThan(1560);
    expect(PHASE_INTERVAL_MS).toBeLessThanOrEqual(2000);
  });

  it('the warm-up is shorter than the measurement and both are whole seconds or half', () => {
    expect(WARMUP_MS).toBeLessThan(MEASURE_MS);
    expect(WARMUP_MS % 500).toBe(0);
    expect(MEASURE_MS % 1000).toBe(0);
  });

  it('every transition of the CSS takes its duration from a motion token', () => {
    expect(DURATION.medium).toBe(480);
    const durations = [...code.matchAll(/([a-z-]+)\s+(\S+)\s+var\(--easing-/g)].map((m) => m[2]);
    expect(durations.length).toBeGreaterThan(10);
    expect(durations.every((duration) => duration?.startsWith('var(--duration-'))).toBe(true);
  });
});
