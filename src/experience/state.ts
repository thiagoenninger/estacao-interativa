export type Level = 'universe' | 'object' | 'material' | 'layer';

export interface TrailNode {
  readonly kind: 'object' | 'material';
  readonly id: string;
}

export const MAX_TRAIL_NODES = 4;

export interface ExperienceState {
  readonly level: Level;
  readonly objectId: string | null;
  readonly materialId: string | null;
  readonly layerId: string | null;
  readonly presentInN: number | null;
  readonly trail: readonly TrailNode[];
  readonly warning: boolean;
}

export const INITIAL_STATE: ExperienceState = Object.freeze({
  level: 'universe',
  objectId: null,
  materialId: null,
  layerId: null,
  presentInN: null,
  trail: Object.freeze([]),
  warning: false,
});
