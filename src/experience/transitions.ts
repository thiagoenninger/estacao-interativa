import type { Catalog } from './catalog.ts';
import { isUserEvent, type ExperienceEvent, type UserEvent, type UserEventType } from './events.ts';
import {
  INITIAL_STATE,
  MAX_TRAIL_NODES,
  type ExperienceState,
  type Level,
  type TrailNode,
} from './state.ts';

type Handler<T extends UserEventType> = (
  state: ExperienceState,
  event: Extract<UserEvent, { type: T }>,
  catalog: Catalog,
) => ExperienceState;

type LevelRules = { [T in UserEventType]?: Handler<T> };

// ------------------------------------------------------- trail

function pushNode(trail: readonly TrailNode[], node: TrailNode): readonly TrailNode[] {
  return [...trail, node].slice(-MAX_TRAIL_NODES);
}

/** Switching material replace the last one instead of stacking */
function withMaterial(trail: readonly TrailNode[], materialId: string): readonly TrailNode[] {
  const node: TrailNode = { kind: 'material', id: materialId };
  const last = trail[trail.length - 1];
  return last?.kind === 'material' ? [...trail.slice(0, -1), node] : pushNode(trail, node);
}

/** Going back to the object dropt the material the trail was pointing at */
function withoutMaterial(trail: readonly TrailNode[]): readonly TrailNode[] {
  const last = trail[trail.length - 1];
  return last?.kind === 'material' ? trail.slice(0, -1) : trail;
}

// --------------------------------------------------------- results
function objectLevel(objectId: string): ExperienceState {
  return {
    ...INITIAL_STATE,
    level: 'object',
    objectId,
    trail: [{ kind: 'object', id: objectId }],
  };
}

function materialLevel(
  state: ExperienceState,
  materialId: string,
  trail: readonly TrailNode[],
): ExperienceState {
  return { ...state, level: 'material', materialId, layerId: null, presentInN: null, trail };
}

// --------------------------------------------------------- the table
/** The faded object in the background becomes the protagonist */
const switchProtagonist: Handler<'select-object'> = (state, event, catalog) =>
  event.objectId === state.objectId || !catalog.hasObject(event.objectId)
    ? state
    : objectLevel(event.objectId);

const switchMaterial: Handler<'select-material'> = (state, event, catalog) => {
  const { objectId } = state;
  if (objectId === null || !catalog.isMaterialOpen(objectId, event.materialId)) return state;
  if (state.level === 'material' && event.materialId === state.materialId) return state;
  return materialLevel(state, event.materialId, withMaterial(state.trail, event.materialId));
};

/** The interaction matrix of the Design System */
export const TRANSITIONS: Readonly<Record<Level, LevelRules>> = {
  universe: {
    'select-object': (state, event, catalog) =>
      catalog.hasObject(event.objectId) ? objectLevel(event.objectId) : state,
  },

  object: {
    'select-object': switchProtagonist,
    'select-material': switchMaterial,
    back: () => INITIAL_STATE,
  },

  material: {
    'select-object': switchProtagonist,
    'select-material': switchMaterial,
    'select-present-in': (state, event, catalog) => {
      const { objectId, materialId } = state;
      if (objectId === null || materialId === null) return state;
      if (!catalog.hasPresentIn(objectId, materialId, event.n)) return state;
      return { ...state, presentInN: state.presentInN === event.n ? null : event.n };
    },
    'open-layer': (state, event, catalog) => {
      const { objectId, materialId } = state;
      if (objectId === null || materialId === null) return state;
      if (!catalog.isLayerOpen(objectId, materialId, event.layerId)) return state;
      return { ...state, level: 'layer', layerId: event.layerId, presentInN: null };
    },
    back: (state) => ({
      ...state,
      level: 'object',
      materialId: null,
      layerId: null,
      presentInN: null,
      trail: withoutMaterial(state.trail),
    }),
    home: () => INITIAL_STATE,
  },

  layer: {
    'select-material': switchMaterial,
    'open-layer': (state, event, catalog) => {
      const { objectId, materialId } = state;
      if (objectId === null || materialId === null || event.layerId === state.layerId) {
        return state;
      }
      if (!catalog.isLayerOpen(objectId, materialId, event.layerId)) return state;
      return { ...state, layerId: event.layerId };
    },
    'open-related': (state, event, catalog) => {
      const { objectId, materialId } = state;
      if (objectId === null || materialId === null) return state;
      if (!catalog.canOpenRelated(objectId, materialId, event.objectId)) return state;
      return {
        ...state,
        level: 'material',
        objectId: event.objectId,
        layerId: null,
        presentInN: null,
        trail: pushNode(state.trail, { kind: 'object', id: event.objectId }),
      };
    },
    back: (state) => ({ ...state, level: 'material', layerId: null }),
    home: () => INITIAL_STATE,
  },
};

export function acceptedEvents(level: Level): UserEventType[] {
  return Object.keys(TRANSITIONS[level]) as UserEventType[];
}

// ---------------------------------------------------------------- the machine
/** The state machine: current state + event = next state */

export function transition(
  state: ExperienceState,
  event: ExperienceEvent,
  catalog: Catalog,
): ExperienceState {
  if (!isUserEvent(event)) {
    if (state.level === 'universe') return state;
    if (event.type === 'idle-warn') return state.warning ? state : { ...state, warning: true };
    return INITIAL_STATE;
  }

  const rules: LevelRules = TRANSITIONS[state.level];
  const handler = rules[event.type] as Handler<typeof event.type> | undefined;
  const next = handler ? handler(state, event as never, catalog) : state;
  return next.warning ? { ...next, warning: false } : next;
}
