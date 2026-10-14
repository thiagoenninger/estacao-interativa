import { describe, expect, it, vi } from 'vitest';
import { createSession } from '@/experience/session.ts';
import { createExperienceStore, stateOf } from '@/experience/store.ts';
import { INITIAL_STATE } from '@/experience/state.ts';
import { createFakeClock } from './fake-clock.ts';
import {
  BACK,
  BACKGROUND,
  HOME,
  WARNING_TOUCH,
  catalog,
  openLayer,
  openRelated,
  selectMaterial,
  selectObject,
} from './world.ts';

function setup() {
  const clock = createFakeClock();
  const session = createSession({ catalog, clock });
  const state = () => stateOf(session.store.getState());
  return { clock, session, state };
}

describe('store', () => {
  it('starts as a new visit', () => {
    const store = createExperienceStore(catalog);
    expect(stateOf(store.getState())).toEqual(INITIAL_STATE);
  });

  it('dispatch says whether the state changed', () => {
    const store = createExperienceStore(catalog);
    expect(store.getState().dispatch(selectObject('bicycle'))).toBe(true);
    expect(store.getState().dispatch(selectObject('bicycle'))).toBe(false);
    expect(store.getState().dispatch(BACKGROUND)).toBe(false);
  });

  it('tells the subscribers only when something changed', () => {
    const store = createExperienceStore(catalog);
    const listener = vi.fn();
    store.subscribe(listener);
    store.getState().dispatch(BACKGROUND);
    store.getState().dispatch(HOME);
    expect(listener).not.toHaveBeenCalled();
    store.getState().dispatch(selectObject('bicycle'));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('keeps the same trail array when the event changes nothing', () => {
    const store = createExperienceStore(catalog);
    store.getState().dispatch(selectObject('bicycle'));
    const { trail } = store.getState();
    store.getState().dispatch(selectMaterial('rubber'));
    expect(store.getState().trail).toBe(trail);
  });

  it('two stores do not share anything', () => {
    const first = createExperienceStore(catalog);
    const second = createExperienceStore(catalog);
    first.getState().dispatch(selectObject('bicycle'));
    expect(second.getState().level).toBe('universe');
  });
});

describe('session', () => {
  it('the short journey of Flows 03: bicycle, aluminium, then 60 s without touch', () => {
    const { session, state, clock } = setup();
    expect(session.dispatch(selectObject('bicycle'))).toBe(true);
    expect(session.dispatch(selectMaterial('aluminium'))).toBe(true);
    expect(state().level).toBe('material');

    clock.advance(49_999);
    expect(state().warning).toBe(false);
    clock.advance(1);
    expect(state()).toMatchObject({ level: 'material', warning: true });

    clock.advance(9_999);
    expect(state().warning).toBe(true);
    clock.advance(1);
    expect(state()).toEqual(INITIAL_STATE);
    expect(session.idle.snapshot().phase).toBe('off');
    expect(clock.pending()).toBe(0);
  });

  it('the medium journey: switch material, "Presente em", layers, Back and Home', () => {
    const { session, state } = setup();
    session.dispatch(selectObject('bicycle'));
    session.dispatch(selectMaterial('aluminium'));
    session.dispatch(selectMaterial('steel'));
    session.dispatch({ type: 'select-present-in', n: 2 });
    expect(state()).toMatchObject({ materialId: 'steel', presentInN: 2 });
    session.dispatch(openLayer('origin'));
    expect(state().level).toBe('layer');
    session.dispatch(BACK);
    expect(state().level).toBe('material');
    session.dispatch(openLayer('origin'));
    session.dispatch(HOME);
    expect(state()).toEqual(INITIAL_STATE);
  });

  it('the network journey: a related object keeps the material, the trail records both', () => {
    const { session, state } = setup();
    session.dispatch(selectObject('bicycle'));
    session.dispatch(selectMaterial('aluminium'));
    session.dispatch(openLayer('origin'));
    session.dispatch(openRelated('can'));
    expect(state()).toMatchObject({ level: 'material', objectId: 'can', materialId: 'aluminium' });
    expect(state().trail.map((node) => node.id)).toEqual(['bicycle', 'aluminium', 'can']);
  });

  it('the universe never runs the timer', () => {
    const { clock, session } = setup();
    expect(clock.pending()).toBe(0);
    session.dispatch(BACKGROUND);
    session.dispatch(selectObject('ghost'));
    expect(clock.pending()).toBe(0);
    clock.advance(120_000);
    expect(stateOf(session.store.getState())).toEqual(INITIAL_STATE);
  });

  it('leaving the universe starts the count; going Back to it stops the count', () => {
    const { clock, session } = setup();
    session.dispatch(selectObject('bicycle'));
    expect(session.idle.snapshot().phase).toBe('counting');
    session.dispatch(BACK);
    expect(session.idle.snapshot().phase).toBe('off');
    expect(clock.pending()).toBe(0);
  });

  it('every touch restarts the count, even one that changes nothing', () => {
    const { clock, session, state } = setup();
    session.dispatch(selectObject('bicycle'));
    clock.advance(45_000);
    session.dispatch(BACKGROUND);
    clock.advance(45_000);
    expect(state().warning).toBe(false);
    clock.advance(5_000);
    expect(state().warning).toBe(true);
  });

  it('a touch on the warning cancels it and the return, state unchanged', () => {
    const { clock, session, state } = setup();
    session.dispatch(selectObject('bicycle'));
    session.dispatch(selectMaterial('aluminium'));
    clock.advance(55_000);
    expect(state().warning).toBe(true);
    session.dispatch(WARNING_TOUCH);
    expect(state()).toMatchObject({ level: 'material', materialId: 'aluminium', warning: false });
    // The count started again at the touch: warning 50 s later, return 60 s later.
    clock.advance(49_999);
    expect(state().warning).toBe(false);
    clock.advance(1);
    expect(state().warning).toBe(true);
    clock.advance(9_999);
    expect(state().level).toBe('material');
    clock.advance(1);
    expect(state()).toEqual(INITIAL_STATE);
  });

  it('a touch the machine does not model also restarts the count', () => {
    const { clock, session, state } = setup();
    session.dispatch(selectObject('bicycle'));
    clock.advance(45_000);
    session.touch();
    clock.advance(45_000);
    expect(state().warning).toBe(false);
  });

  it('a new visit after the automatic return has no memory of the previous one', () => {
    const { clock, session, state } = setup();
    session.dispatch(selectObject('bicycle'));
    session.dispatch(selectMaterial('aluminium'));
    session.dispatch({ type: 'select-present-in', n: 1 });
    clock.advance(60_000);
    session.dispatch(selectObject('can'));
    expect(state()).toMatchObject({ objectId: 'can', materialId: null, presentInN: null });
    expect(state().trail).toEqual([{ kind: 'object', id: 'can' }]);
  });

  it('dispose stops the timers and a new event arms them again', () => {
    const { clock, session, state } = setup();
    session.dispatch(selectObject('bicycle'));
    session.dispose();
    expect(clock.pending()).toBe(0);
    clock.advance(100_000);
    expect(state().warning).toBe(false);
    session.dispatch(BACKGROUND);
    expect(clock.pending()).toBe(2);
  });

  it('keeps stations apart: two sessions never share state or time', () => {
    const clock = createFakeClock();
    const first = createSession({ catalog, clock });
    const second = createSession({ catalog, clock });
    first.dispatch(selectObject('bicycle'));
    clock.advance(30_000);
    second.dispatch(selectObject('can'));
    clock.advance(30_000);
    expect(first.store.getState().level).toBe('universe');
    expect(second.store.getState()).toMatchObject({ level: 'object', objectId: 'can' });
  });

  it('accepts other idle times', () => {
    const clock = createFakeClock();
    const session = createSession({
      catalog,
      clock,
      idle: { warnAfterMs: 1000, returnAfterMs: 2000 },
    });
    session.dispatch(selectObject('bicycle'));
    clock.advance(1000);
    expect(session.store.getState().warning).toBe(true);
    clock.advance(1000);
    expect(session.store.getState().level).toBe('universe');
  });
});
