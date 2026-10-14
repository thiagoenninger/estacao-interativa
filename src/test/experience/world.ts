import type { Catalog } from '@/experience/catalog.ts';
import type { ExperienceEvent, SystemEvent, UserEvent } from '@/experience/events.ts';
import { INITIAL_STATE, type ExperienceState } from '@/experience/state.ts';
import { transition } from '@/experience/transitions.ts';

export interface MaterialSpec {
  open?: boolean;
  layers?: Record<string, boolean>;
  present?: number[];
  related?: string[];
}

export type WorldSpec = Record<string, Record<string, MaterialSpec>>;

export const WORLD: WorldSpec = {
  bicycle: {
    aluminium: {
      layers: { origin: true, production: true, uses: false },
      present: [1, 2, 3],
      related: ['can', 'laptop'],
    },
    steel: { layers: { origin: true }, present: [1, 2], related: ['pot', 'can'] },
    rubber: { open: false, layers: { origin: true }, present: [1] },
  },
  can: {
    aluminium: { layers: { origin: true }, present: [1, 2], related: ['bicycle'] },
    steel: { layers: { origin: true }, present: [1], related: ['pot'] },
  },
  pot: {
    steel: { layers: { origin: true }, present: [1], related: ['bicycle'] },
  },
  laptop: {
    aluminium: { open: false, present: [1] },
    steel: { present: [1] },
  },
};

export function makeCatalog(world: WorldSpec = WORLD): Catalog {
  const spec = (objectId: string, materialId: string) => world[objectId]?.[materialId];
  const isMaterialOpen = (objectId: string, materialId: string) => {
    const item = spec(objectId, materialId);
    return item !== undefined && item.open !== false;
  };
  return {
    hasObject: (objectId) => world[objectId] !== undefined,
    isMaterialOpen,
    hasPresentIn: (objectId, materialId, n) =>
      spec(objectId, materialId)?.present?.includes(n) ?? false,
    isLayerOpen: (objectId, materialId, layerId) =>
      spec(objectId, materialId)?.layers?.[layerId] === true,
    canOpenRelated: (objectId, materialId, relatedId) =>
      (spec(objectId, materialId)?.related?.includes(relatedId) ?? false) &&
      isMaterialOpen(relatedId, materialId),
  };
}

export const catalog = makeCatalog();

/** Runs events one after the other, from `from` (the start of a visit by default). */
export function run(
  events: ExperienceEvent[],
  from: ExperienceState = INITIAL_STATE,
  using: Catalog = catalog,
): ExperienceState {
  return events.reduce((state, event) => transition(state, event, using), from);
}

export const selectObject = (objectId: string): UserEvent => ({
  type: 'select-object',
  objectId,
});
export const selectMaterial = (materialId: string): UserEvent => ({
  type: 'select-material',
  materialId,
});
export const openLayer = (layerId: string): UserEvent => ({ type: 'open-layer', layerId });
export const openRelated = (objectId: string): UserEvent => ({
  type: 'open-related',
  objectId,
});
export const selectPresentIn = (n: number): UserEvent => ({
  type: 'select-present-in',
  n,
});
export const BACK: UserEvent = { type: 'back' };
export const HOME: UserEvent = { type: 'home' };
export const BACKGROUND: UserEvent = { type: 'touch-background' };
export const WARNING_TOUCH: UserEvent = { type: 'touch-warning' };
export const WARN: SystemEvent = { type: 'idle-warn' };
export const RETURN: SystemEvent = { type: 'idle-return' };

/** States at each level, all with the bicycle and aluminium. */
export const AT_OBJECT = run([selectObject('bicycle')]);
export const AT_MATERIAL = run([selectObject('bicycle'), selectMaterial('aluminium')]);
export const AT_LAYER = run([
  selectObject('bicycle'),
  selectMaterial('aluminium'),
  openLayer('origin'),
]);

/** Freezes a state all the way down: any write by the machine throws. */
export function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
