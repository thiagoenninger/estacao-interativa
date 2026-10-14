import { describe, expect, it } from 'vitest';
import { MAX_TRAIL_NODES } from '@/experience/state.ts';
import {
  BACK,
  HOME,
  WARN,
  RETURN,
  openLayer,
  openRelated,
  run,
  selectMaterial,
  selectObject,
} from './world.ts';

const object = (id: string) => ({ kind: 'object', id });
const material = (id: string) => ({ kind: 'material', id });

describe('the investigation trail', () => {
  it('starts with the object and adds the material', () => {
    expect(run([selectObject('bicycle')]).trail).toEqual([object('bicycle')]);
    expect(run([selectObject('bicycle'), selectMaterial('aluminium')]).trail).toEqual([
      object('bicycle'),
      material('aluminium'),
    ]);
  });

  it('switching the material replaces it instead of stacking', () => {
    const state = run([
      selectObject('bicycle'),
      selectMaterial('aluminium'),
      selectMaterial('steel'),
      selectMaterial('aluminium'),
    ]);
    expect(state.trail).toEqual([object('bicycle'), material('aluminium')]);
  });

  it('opening a layer does not change the trail', () => {
    const before = run([selectObject('bicycle'), selectMaterial('aluminium')]);
    expect(run([openLayer('origin'), openLayer('production')], before).trail).toEqual(before.trail);
  });

  it('records both objects when a related object opens (bicycle · aluminium · can)', () => {
    const state = run([
      selectObject('bicycle'),
      selectMaterial('aluminium'),
      openLayer('origin'),
      openRelated('can'),
    ]);
    expect(state.trail).toEqual([object('bicycle'), material('aluminium'), object('can')]);
    expect(state).toMatchObject({ objectId: 'can', materialId: 'aluminium', level: 'material' });
  });

  it('after a related object, switching material goes on from the end of the trail', () => {
    const state = run([
      selectObject('bicycle'),
      selectMaterial('aluminium'),
      openLayer('origin'),
      openRelated('can'),
      selectMaterial('steel'),
    ]);
    expect(state.trail).toEqual([
      object('bicycle'),
      material('aluminium'),
      object('can'),
      material('steel'),
    ]);
  });

  it('keeps at most four nodes: the oldest leave first', () => {
    const state = run([
      selectObject('bicycle'),
      selectMaterial('aluminium'),
      openLayer('origin'),
      openRelated('can'),
      selectMaterial('steel'),
      openLayer('origin'),
      openRelated('pot'),
    ]);
    expect(state.trail).toHaveLength(MAX_TRAIL_NODES);
    expect(state.trail).toEqual([
      material('aluminium'),
      object('can'),
      material('steel'),
      object('pot'),
    ]);
  });

  it('Back from the material drops the material, and keeps the related object', () => {
    const related = run([
      selectObject('bicycle'),
      selectMaterial('aluminium'),
      openLayer('origin'),
      openRelated('can'),
    ]);
    expect(run([BACK], related).trail).toEqual([
      object('bicycle'),
      material('aluminium'),
      object('can'),
    ]);
  });

  it('choosing another protagonist starts a new trail', () => {
    const state = run([selectObject('bicycle'), selectMaterial('aluminium'), selectObject('can')]);
    expect(state.trail).toEqual([object('can')]);
  });

  it.each([
    ['Home', HOME],
    ['the automatic return', RETURN],
  ])('%s empties the trail', (_name, event) => {
    const state = run([selectObject('bicycle'), selectMaterial('aluminium'), event]);
    expect(state.trail).toEqual([]);
  });

  it('the warning does not touch the trail', () => {
    const before = run([selectObject('bicycle'), selectMaterial('aluminium')]);
    expect(run([WARN], before).trail).toBe(before.trail);
  });
});
