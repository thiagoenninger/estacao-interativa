import { createStore, type StoreApi } from 'zustand/vanilla';
import type { Catalog } from './catalog.ts';
import type { ExperienceEvent } from './events.ts';
import { INITIAL_STATE, type ExperienceState } from './state.ts';
import { transition } from './transitions.ts';

export type ExperienceStore = ExperienceState & {
  dispatch(event: ExperienceEvent): boolean;
};

export type ExperienceStoreApi = StoreApi<ExperienceStore>;

export function stateOf(store: ExperienceStore): ExperienceState {
  return {
    level: store.level,
    objectId: store.objectId,
    materialId: store.materialId,
    layerId: store.layerId,
    presentInN: store.presentInN,
    trail: store.trail,
    warning: store.warning,
  };
}

/** Zustand holds the state and tells React when changes */
export function createExperienceStore(catalog: Catalog): ExperienceStoreApi {
  return createStore<ExperienceStore>()((set, get) => ({
    ...INITIAL_STATE,
    dispatch(event) {
      const current = stateOf(get());
      const next = transition(current, event, catalog);
      if (next === current) return false;
      set(next);
      return true;
    },
  }));
}
