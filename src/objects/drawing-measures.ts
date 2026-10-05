export const STROKE = { universe: 2.6, selected: 3.2, thumnail: 2.2 } as const;

export const STROKE_RATIO = { fine: 0.62, highlight: 1.35 } as const;

export const UNIVERSE_SIZE = { near: 340, mid: 260, far: 200 } as const;
export const THUMNAIL_SIZE = 120;

export const MIN_STROKE_GAP = 6;

export const MAX_INTERNAL_GROUPS_PER_MATERIAL = 6;

export const LEVEL_IDS = ['level-0-universe', 'level-1-structure', 'level-2-internal'] as const;

export const STROKE_KINDS = ['line', 'fine', 'dashed', 'filled'] as const;
export type StrokeKind = (typeof STROKE_KINDS)[number];
