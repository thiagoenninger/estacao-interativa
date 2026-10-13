import { describe, expect, it } from 'vitest';
import { USER_EVENT_TYPES, type UserEventType } from '@/experience/events.ts';
import { INITIAL_STATE, type Level } from '@/experience/state.ts';
import { TRANSITIONS, acceptedEvents, transition } from '@/experience/transitions.ts';
import {
  AT_LAYER,
  AT_MATERIAL,
  AT_OBJECT,
  BACK,
  BACKGROUND,
  HOME,
  RETURN,
  WARN,
  WARNING_TOUCH,
  catalog,
  deepFreeze,
  openLayer,
  openRelated,
  run,
  selectMaterial,
  selectObject,
  selectPresentIn,
} from './world.ts';

describe('the interaction matrix as a table', () => {
  // Design System, Flows 02: the events each level reacts to. Everything else is "—",
  // "Sem ação" or "Não existe", and does nothing.
  const MATRIX: Record<Level, UserEventType[]> = {
    universe: ['select-object'],
    object: ['select-object', 'select-material', 'back'],
    material: [
      'select-object',
      'select-material',
      'select-present-in',
      'open-layer',
      'back',
      'home',
    ],
    layer: ['select-material', 'open-layer', 'open-related', 'back', 'home'],
  };

  it.each(Object.entries(MATRIX) as [Level, UserEventType[]][])(
    'level %s reacts only to the events of the matrix',
    (level, expected) => {
      expect([...acceptedEvents(level)].sort()).toEqual([...expected].sort());
    },
  );

  it('has a row for each of the four levels', () => {
    expect(Object.keys(TRANSITIONS).sort()).toEqual(['layer', 'material', 'object', 'universe']);
  });

  it('knows the nine user events of the matrix', () => {
    expect(USER_EVENT_TYPES).toHaveLength(9);
  });

  it('touching the background does nothing, anywhere', () => {
    for (const state of [INITIAL_STATE, AT_OBJECT, AT_MATERIAL, AT_LAYER]) {
      expect(transition(state, BACKGROUND, catalog)).toBe(state);
    }
  });
});

describe('universe (01)', () => {
  it('selecting an object opens it (M01) with a trail of one node', () => {
    const next = run([selectObject('bicycle')]);
    expect(next).toMatchObject({
      level: 'object',
      objectId: 'bicycle',
      materialId: null,
      layerId: null,
      presentInN: null,
      warning: false,
    });
    expect(next.trail).toEqual([{ kind: 'object', id: 'bicycle' }]);
  });

  it('ignores an object that does not exist', () => {
    expect(run([selectObject('ghost')])).toBe(INITIAL_STATE);
  });

  it.each([
    selectMaterial('aluminium'),
    selectPresentIn(1),
    openLayer('origin'),
    openRelated('can'),
    BACK,
    HOME,
    WARNING_TOUCH,
  ])('ignores %j: Back and Home do not exist here', (event) => {
    expect(transition(INITIAL_STATE, event, catalog)).toBe(INITIAL_STATE);
  });
});

describe('object (03)', () => {
  it('a faded object takes over as the protagonist', () => {
    const next = run([selectObject('can')], AT_OBJECT);
    expect(next).toMatchObject({ level: 'object', objectId: 'can', materialId: null });
    expect(next.trail).toEqual([{ kind: 'object', id: 'can' }]);
  });

  it('the protagonist itself does nothing', () => {
    expect(transition(AT_OBJECT, selectObject('bicycle'), catalog)).toBe(AT_OBJECT);
  });

  it('an object that does not exist does nothing', () => {
    expect(transition(AT_OBJECT, selectObject('ghost'), catalog)).toBe(AT_OBJECT);
  });

  it('a material sphere opens the panel (M02)', () => {
    const next = transition(AT_OBJECT, selectMaterial('aluminium'), catalog);
    expect(next).toMatchObject({
      level: 'material',
      objectId: 'bicycle',
      materialId: 'aluminium',
      layerId: null,
    });
    expect(next.trail).toEqual([
      { kind: 'object', id: 'bicycle' },
      { kind: 'material', id: 'aluminium' },
    ]);
  });

  it('a disabled material cannot be opened', () => {
    expect(transition(AT_OBJECT, selectMaterial('rubber'), catalog)).toBe(AT_OBJECT);
  });

  it('a material of another object cannot be opened', () => {
    expect(transition(AT_OBJECT, selectMaterial('gold'), catalog)).toBe(AT_OBJECT);
  });

  it('Back goes to the universe (M06) and forgets everything', () => {
    expect(transition(AT_OBJECT, BACK, catalog)).toBe(INITIAL_STATE);
  });

  it.each([HOME, selectPresentIn(1), openLayer('origin'), openRelated('can'), WARNING_TOUCH])(
    'ignores %j',
    (event) => {
      expect(transition(AT_OBJECT, event, catalog)).toBe(AT_OBJECT);
    },
  );
});

describe('material (04/05)', () => {
  it('a faded object goes back to level 03 with that object', () => {
    const next = transition(AT_MATERIAL, selectObject('can'), catalog);
    expect(next).toMatchObject({
      level: 'object',
      objectId: 'can',
      materialId: null,
      layerId: null,
      presentInN: null,
    });
    expect(next.trail).toEqual([{ kind: 'object', id: 'can' }]);
  });

  it('the protagonist does nothing', () => {
    expect(transition(AT_MATERIAL, selectObject('bicycle'), catalog)).toBe(AT_MATERIAL);
  });

  it('another sphere switches the material in the same level (M03)', () => {
    const next = transition(AT_MATERIAL, selectMaterial('steel'), catalog);
    expect(next).toMatchObject({ level: 'material', objectId: 'bicycle', materialId: 'steel' });
  });

  it('the same sphere or a disabled one does nothing', () => {
    expect(transition(AT_MATERIAL, selectMaterial('aluminium'), catalog)).toBe(AT_MATERIAL);
    expect(transition(AT_MATERIAL, selectMaterial('rubber'), catalog)).toBe(AT_MATERIAL);
  });

  it('switching the material clears the highlighted item', () => {
    const lit = transition(AT_MATERIAL, selectPresentIn(2), catalog);
    expect(transition(lit, selectMaterial('steel'), catalog).presentInN).toBeNull();
  });

  it('an item of "Presente em" highlights its hotspots (M04)', () => {
    expect(transition(AT_MATERIAL, selectPresentIn(2), catalog).presentInN).toBe(2);
  });

  it('another item moves the highlight; the same item turns it off', () => {
    const second = run([selectPresentIn(2)], AT_MATERIAL);
    expect(run([selectPresentIn(3)], second).presentInN).toBe(3);
    expect(run([selectPresentIn(2)], second).presentInN).toBeNull();
  });

  it('an item that does not exist does nothing', () => {
    expect(transition(AT_MATERIAL, selectPresentIn(9), catalog)).toBe(AT_MATERIAL);
  });

  it('a layer link with text opens the layer', () => {
    const next = transition(AT_MATERIAL, openLayer('production'), catalog);
    expect(next).toMatchObject({
      level: 'layer',
      objectId: 'bicycle',
      materialId: 'aluminium',
      layerId: 'production',
      presentInN: null,
    });
  });

  it('a layer "EM BREVE" or unknown does not open', () => {
    expect(transition(AT_MATERIAL, openLayer('uses'), catalog)).toBe(AT_MATERIAL);
    expect(transition(AT_MATERIAL, openLayer('nothing'), catalog)).toBe(AT_MATERIAL);
  });

  it('Back returns to the object (M05) and keeps the object in the trail', () => {
    const next = transition(AT_MATERIAL, BACK, catalog);
    expect(next).toMatchObject({
      level: 'object',
      objectId: 'bicycle',
      materialId: null,
      layerId: null,
      presentInN: null,
    });
    expect(next.trail).toEqual([{ kind: 'object', id: 'bicycle' }]);
  });

  it('Home returns to the universe', () => {
    expect(transition(AT_MATERIAL, HOME, catalog)).toBe(INITIAL_STATE);
  });

  it('a related object does nothing here: it lives inside the layers', () => {
    expect(transition(AT_MATERIAL, openRelated('can'), catalog)).toBe(AT_MATERIAL);
  });
});

describe('deepened layer', () => {
  it('a faded object and "Presente em" do nothing', () => {
    expect(transition(AT_LAYER, selectObject('can'), catalog)).toBe(AT_LAYER);
    expect(transition(AT_LAYER, selectPresentIn(1), catalog)).toBe(AT_LAYER);
  });

  it('another layer link switches the layer', () => {
    const next = transition(AT_LAYER, openLayer('production'), catalog);
    expect(next).toMatchObject({ level: 'layer', layerId: 'production' });
  });

  it('the open layer, a layer "EM BREVE" and an unknown layer do nothing', () => {
    expect(transition(AT_LAYER, openLayer('origin'), catalog)).toBe(AT_LAYER);
    expect(transition(AT_LAYER, openLayer('uses'), catalog)).toBe(AT_LAYER);
    expect(transition(AT_LAYER, openLayer('nothing'), catalog)).toBe(AT_LAYER);
  });

  it('a material sphere closes the layer and switches the material', () => {
    const next = transition(AT_LAYER, selectMaterial('steel'), catalog);
    expect(next).toMatchObject({
      level: 'material',
      objectId: 'bicycle',
      materialId: 'steel',
      layerId: null,
    });
  });

  it('the current sphere also closes the layer', () => {
    const next = transition(AT_LAYER, selectMaterial('aluminium'), catalog);
    expect(next).toMatchObject({ level: 'material', materialId: 'aluminium', layerId: null });
  });

  it('a disabled sphere does nothing', () => {
    expect(transition(AT_LAYER, selectMaterial('rubber'), catalog)).toBe(AT_LAYER);
  });

  it('a related object opens with the same material', () => {
    const next = transition(AT_LAYER, openRelated('can'), catalog);
    expect(next).toMatchObject({
      level: 'material',
      objectId: 'can',
      materialId: 'aluminium',
      layerId: null,
      presentInN: null,
    });
  });

  it('refuses an object that is not related, that is the same, or lacks the material', () => {
    expect(transition(AT_LAYER, openRelated('pot'), catalog)).toBe(AT_LAYER);
    expect(transition(AT_LAYER, openRelated('bicycle'), catalog)).toBe(AT_LAYER);
    // The laptop is related but its aluminium is disabled.
    expect(transition(AT_LAYER, openRelated('laptop'), catalog)).toBe(AT_LAYER);
  });

  it('Back returns to the material sheet', () => {
    const next = transition(AT_LAYER, BACK, catalog);
    expect(next).toMatchObject({
      level: 'material',
      objectId: 'bicycle',
      materialId: 'aluminium',
      layerId: null,
    });
    expect(next.trail).toEqual(AT_LAYER.trail);
  });

  it('Home returns to the universe', () => {
    expect(transition(AT_LAYER, HOME, catalog)).toBe(INITIAL_STATE);
  });
});

describe('the return warning (08) and the automatic return', () => {
  it('the warning appears away from the universe, once', () => {
    const warned = transition(AT_MATERIAL, WARN, catalog);
    expect(warned).toEqual({ ...AT_MATERIAL, warning: true });
    expect(transition(warned, WARN, catalog)).toBe(warned);
  });

  it('there is nothing to warn about in the universe', () => {
    expect(transition(INITIAL_STATE, WARN, catalog)).toBe(INITIAL_STATE);
    expect(transition(INITIAL_STATE, RETURN, catalog)).toBe(INITIAL_STATE);
  });

  it.each([
    ['object', AT_OBJECT],
    ['material', AT_MATERIAL],
    ['layer', AT_LAYER],
  ])('the automatic return erases the visit from the %s level', (_name, state) => {
    expect(transition(transition(state, WARN, catalog), RETURN, catalog)).toBe(INITIAL_STATE);
    expect(transition(state, RETURN, catalog)).toBe(INITIAL_STATE);
  });

  it('touching the warning closes it and changes nothing else', () => {
    const warned = transition(AT_LAYER, WARN, catalog);
    expect(transition(warned, WARNING_TOUCH, catalog)).toEqual(AT_LAYER);
  });

  it('touching the background closes the warning too', () => {
    const warned = transition(AT_MATERIAL, WARN, catalog);
    expect(transition(warned, BACKGROUND, catalog)).toEqual(AT_MATERIAL);
  });

  it('any other touch closes the warning and also does its job', () => {
    const warned = transition(AT_MATERIAL, WARN, catalog);
    const next = transition(warned, selectMaterial('steel'), catalog);
    expect(next).toMatchObject({ materialId: 'steel', warning: false });
  });

  it('a touch that does nothing still closes the warning', () => {
    const warned = transition(AT_OBJECT, WARN, catalog);
    expect(transition(warned, HOME, catalog)).toEqual(AT_OBJECT);
  });

  it('Back during the warning goes back one level, without the warning', () => {
    const warned = transition(AT_LAYER, WARN, catalog);
    const next = transition(warned, BACK, catalog);
    expect(next).toMatchObject({ level: 'material', warning: false });
  });

  it('the start of a visit is empty: no memory of the previous visitor', () => {
    expect(INITIAL_STATE).toEqual({
      level: 'universe',
      objectId: null,
      materialId: null,
      layerId: null,
      presentInN: null,
      trail: [],
      warning: false,
    });
    expect(Object.isFrozen(INITIAL_STATE)).toBe(true);
  });
});

describe('the machine is pure', () => {
  it('never changes the state it receives', () => {
    const events = [
      selectObject('bicycle'),
      selectObject('can'),
      selectMaterial('aluminium'),
      selectMaterial('steel'),
      selectPresentIn(1),
      openLayer('origin'),
      openLayer('production'),
      openRelated('can'),
      BACK,
      HOME,
      BACKGROUND,
      WARNING_TOUCH,
      WARN,
      RETURN,
    ];
    for (const state of [INITIAL_STATE, AT_OBJECT, AT_MATERIAL, AT_LAYER]) {
      const frozen = deepFreeze(structuredClone(state));
      for (const event of events) {
        expect(() => transition(frozen, event, catalog)).not.toThrow();
      }
    }
  });
});
